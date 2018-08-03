import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import SwiperFlatList from "react-native-swiper-flatlist";
import XPBar from "./XPBar";

const UserJourneys = props => {
  let { journeys } = props.journeyObj.data;

  const millisecondsInAWeek = 604800000;
  const millisecondsIn4Weeks = millisecondsInAWeek * 4;
  let totalKmTraveled;
  let xp;
  let xpLastMission;
  let xpLast7Days;
  let xpLast4Weeks;

  // Last mission stats
  let lastMissonDistance = 0;
  let lastMissionLargeCarCarbonOutput = 0;
  let lastMissionCarbonYouSaved = 0;

  let lastMissionMode = 'Your way';

  let lastMissionDuration = 0;
  let lastMissionDurationMins = 0;
  let lastMissionDurationSeconds = 0;

  const distance = (lat1, long1, lat2, long2) => {
    const deg2rad = Math.PI / 180;
    const cos = Math.cos;
    lat1 *= deg2rad;
    long1 *= deg2rad;
    lat2 *= deg2rad;
    long2 *= deg2rad;
    const a =
      (1 -
        cos(lat2 - lat1) +
        (1 - cos(long2 - long1)) * cos(lat1) * cos(lat2)) /
      2;
    return 12742 * Math.asin(Math.sqrt(a));
  };

  // Takes mission composing of 3 arrays. latArr, longArr, timeArr
  getDistanceBetweenCoordinates = mission => {
    const { latArr, longArr } = mission;
    const distanceTraveled = [];
    latArr.forEach((l, index) => {
      const pos = latArr.length - 2;
      if (index <= pos) {
        distanceTraveled.push(
          distance(
            latArr[index],
            longArr[index],
            latArr[index + 1],
            longArr[index + 1]
          )
        );
      }
    });
    return distanceTraveled;
  };

  getLongLatDetails = () => {
    const missionsArrCoords = journeys.map(journey => {
      const latArr = [];
      const longArr = [];
      const timeArr = [];
      // Access each journey the user has ever taken
      journey.route.forEach(coords => {
        // All lats to the lats array. etc
        latArr.push(coords.lat);
        longArr.push(coords.long);
        timeArr.push(coords.time);
      });
      return {
        latArr,
        longArr,
        timeArr
      };
    });

    // missionDetails is an array of arrays. Each array is a list of distances between each set of coordinates from a mission.
    const missionDetails = missionsArrCoords.map(mission => {
      return getDistanceBetweenCoordinates(mission);
    });

    // totalMissionDistance is an array of the total distance covered for each mission
    const totalMissionDistance = missionDetails.map(mission => {
      return mission.reduce((acc, dist) => {
        acc += dist;
        return acc;
      }, 0);
    });

    // totalPointsPerMissionArr is the points scored for each mission
    const totalPointsPerMissionArr = missionDetails.map((mission, index) => {
      let carbonRatio;
      let totalPoints = 0;
      // let last7DaysPoints = 0;
      // let last4WeeksPoints = 0;

      mission.forEach(dist => {
        switch (journeys[index].mode) {
          case "walk":
          case "foot":
          case "foot 👣":
          case "bicycle":
          case "bicycle 🚲":
          case "cycle":
            carbonRatio = 0;
            break;
          case "bus":
          case "bus 🚌":
            carbonRatio = 0.069;
            break;
          case "tram":
          case "tram 🚊":
            carbonRatio = 0.042;
            break;
          case "motorbike":
            carbonRatio = 0.094;
            break;
          case "car-electric":
          case "electric car":
          case "electric car 🚗⚡️":
            carbonRatio = 0.043;
            break;
          case "train":
          case "train 🚂":
            carbonRatio = 0.06;
            break;
          case "taxi":
          case "taxi 🚕":
            carbonRatio = 0.17;
            break;
          default:
            console.log(
              journeys[index].mode,
              "is a mode not in switch statement - UserJourneys.js"
            );
        }

        const baseline = dist * 0.183;
        const yourTrip = dist * carbonRatio;
        totalPoints += baseline - yourTrip;
      });
      return totalPoints;
    });

    // xp - all missions points. To 3 decimal places
    xp = totalPointsPerMissionArr
      .reduce((acc, scores) => {
        acc += scores;
        return acc;
      }, 0)
      .toFixed(1);

    // Last misson stats
    lastMissonDistance = totalMissionDistance[totalMissionDistance.length - 1].toFixed(0);
    lastMissionLargeCarCarbonOutput = (lastMissonDistance * 0.183).toFixed(3);
    lastMissionCarbonYouSaved = totalPointsPerMissionArr[totalPointsPerMissionArr.length - 1].toFixed(3);
    
    lastMissionMode = journeys[journeys.length - 1].mode;

    // To prevent app crash if returns undefined
    if (journeys[journeys.length - 1].route[1] !== undefined) {
      lastMissionDuration = journeys[journeys.length - 1].route[1].time - journeys[journeys.length - 1].route[0].time
      lastMissionDurationMins = (lastMissionDuration / 1000 / 60).toFixed(0)
      lastMissionDurationSeconds = (60 * ((lastMissionDuration / 1000 / 60) % 1)).toFixed(0);
    }

    // xpLast7Days - all mission points from the last 7 days.
    xpLast7Days = totalPointsPerMissionArr
      .reduce((acc, scores, index) => {
        if (Date.now() - journeys[index].route[0].time <= millisecondsInAWeek) {
          acc += scores;
        }
        return acc;
      }, 0)
      .toFixed(1);

    // xpLast4Weeks - all mission points from the last 4 weeks
    xpLast4Weeks = totalPointsPerMissionArr
      .reduce((acc, scores, index) => {
        if (
          Date.now() - journeys[index].route[0].time <=
          millisecondsIn4Weeks
        ) {
          acc += scores;
        }
        return acc;
      }, 0)
      .toFixed(1);

    // totalKmTraveled is a sum of the users total kms travelled.
    totalKmTraveled = totalMissionDistance
      .reduce((acc, mission) => {
        acc += mission;
        return acc;
      }, 0)
      .toFixed(2);
  };

  getLongLatDetails();

  return (
    <View>
      <View style={styles.XPBar}>
        <XPBar XP={xp} />
      </View>

      <View style={styles.statCard}>
        <View style={styles.statsTitle}>
          <Text style={styles.title}>STATS</Text>
        </View>
        <SwiperFlatList
          showPagination
          paginationActiveColor={"rgb(0, 220, 90)"}
          paginationDefaultColor={"rgb(200,200,200)"}
        >
          {/* Last mission stats */}
          <View style={styles.child}>
            <Text style={[styles.missionText, { letterSpacing: 3 }]}>Last mission</Text>
            <Text style={[styles.missionText, { letterSpacing: 3 }]}>{`Time: ${lastMissionDurationMins} min ${lastMissionDurationSeconds} sec`}</Text>
            <Text style={[styles.missionText, { letterSpacing: 3 }]}>{`CO2 saved: ${lastMissionCarbonYouSaved} kgs`}</Text>
            <Text style={[styles.missionText, { letterSpacing: 3 }]}>{`Car would have used: ${lastMissionLargeCarCarbonOutput} kgs`}</Text>
            <Text style={[styles.missionText, { letterSpacing: 3 }]}>{`Distance: ${lastMissonDistance} kms`}</Text>
            <Text style={[styles.missionText, { letterSpacing: 3 }]}>{`Mode: ${lastMissionMode}`}</Text>
          </View>

          <View style={styles.child}>
            <Text style={[styles.text, { letterSpacing: 3 }]}>
              Total distance:
            </Text>
            <Text style={styles.text}>{totalKmTraveled} kms</Text>
          </View>
          <View style={styles.child}>
            <Text style={[styles.text, { letterSpacing: 3 }]}>
              Total no. missions:
            </Text>
            <Text style={styles.text}>
              {props.journeyObj.data.journeys.length}
            </Text>
          </View>
          <View style={styles.child}>
            <Text style={[styles.text, { letterSpacing: 3 }]}>Total XP:</Text>
            <Text style={styles.text}>{xp} kgs CO2</Text>
          </View>
          <View style={styles.child}>
            <Text style={[styles.text, { letterSpacing: 3 }]}>
              XP this week:
            </Text>
            <Text style={styles.text}>{xpLast7Days} kgs CO2</Text>
          </View>
          <View style={styles.child}>
            <Text style={[styles.text, { letterSpacing: 3 }]}>
              XP this month:
            </Text>
            <Text style={styles.text}>{xpLast4Weeks} kgs CO2</Text>
          </View>
        </SwiperFlatList>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  XPBar: {
    backgroundColor: "#F5FCFF",
    elevation: 1,
    marginVertical: 5,
    padding: 4,
    paddingTop: 6
  },
  statCard: {
    backgroundColor: "#F5FCFF",
    elevation: 1,
    marginBottom: 10,
    padding: 5
  },
  statsTitle: {
    borderColor: "rgb(150,180,150)",
    marginBottom: -30,
    paddingBottom: 5,
    borderBottomWidth: 1
  },
  title: {
    fontSize: 24,
    fontFamily: "Righteous-Regular",
    textAlign: "center"
  },
  child: {
    alignItems: "center",
    height: height * 0.2,
    width: width - 10,
    justifyContent: "center"
  },
  text: {
    fontSize: 20,
    fontFamily: "Righteous-Regular"
  },
  missionText: {
    fontSize: 10,
    fontFamily: "Righteous-Regular"
  }
});

export default UserJourneys;
