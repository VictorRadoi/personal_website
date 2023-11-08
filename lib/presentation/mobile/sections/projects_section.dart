import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/square_tile_tablet.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class ProjectsSection extends StatelessWidget {
  const ProjectsSection({super.key});

  @override
  Widget build(BuildContext context) {
    bool isScreenWide = MediaQuery.of(context).size.width >= 1000;
    return Padding(
      padding: const EdgeInsets.only(left: 50, right: 50, top: 20),
      child: Flex(
        direction: isScreenWide ? Axis.horizontal : Axis.vertical,
        children: const [
          SquareTileTablet(
            title: 'GestureXR',
            description:
                """Master thesis project consisting of a machine learning algorithm designed to recognize hand gestures in real time and facilitate freehand interaction with virtual objects. Researching and comparing the performance of different machine learning models for dynamic hand gesture recognition. Python implementation using ML libraries (PyTorch, TensorFlow) and integration within a simple mobile application that enables real time testing.""",
            icon: FontAwesomeIcons.hand,
            color: Colors.red,
          ),
          SizedBox(
            height: 50,
          ),
          SquareTileTablet(
            title: 'AirQRunner',
            description:
                """Undergraduate final year project consisting of an activity tracking application which makes recommendations for running routes by
avoiding areas with high leveles of pollution. Developed the backend service using Python, Flask and Firebase. Implemented a custom path finding algorithm based on A* which
calculates the route cost based on 2 options: a given running distance or a destination provided by the user. Implemented a cross-platform Flutter application, using Figma for mock-up design and several third-party libraries for the business
logic implementation (OpenStreetMaps, Google Maps Location)""",
            icon: FontAwesomeIcons.personRunning,
            color: Colors.orange,
          ),
          SizedBox(
            height: 50,
          ),
          SquareTileTablet(
            title: 'RezerWith',
            description:
                """As part of a team of 4 developers, designed an application with the purpose of connecting small businesses within our local
community with potential customers. Worked on both the frontend and backend of the application, applying technologies such as Flutter, Firebase and Firestore. Implemented several UI components and features including authentication, business logic for appointment creation and custom
calendars.""",
            icon: FontAwesomeIcons.shop,
            color: Colors.blue,
          ),
          SquareTileTablet(
            title: 'Teamboard',
            description:
                """Developed an application that enables sport clubs and teams to coordinate their sporting events. Designed features
such as team chat, interactive calendar and custom player profiles. Cross-platform development using Flutter with a backend developed in NGINX, Flask, and SQL. Applied clean
architecture principles and design patterns (BloC). Led end-to-end product development as part of a small team, engaging with clients and incorporating multiple project
iterations to enhance user experience based on customer feedback.""",
            icon: FontAwesomeIcons.personBiking,
            color: Colors.green,
          ),
        ],
      ),
    );
  }
}
