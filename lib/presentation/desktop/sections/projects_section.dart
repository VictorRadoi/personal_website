import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/square_tile_desktop.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class ProjectsSection extends StatelessWidget {
  const ProjectsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(left: 50, right: 50, top: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          SquareTileDesktop(
            title: 'GestureXR',
            description:
                """• Developed a dynamic gesture recognition system for freehand interaction in AR applications
    • Architected a two‑stream neural network based on CNN and RNN cells, combining RGB and skeletal input
    • Implemented in Python (MediaPipe, TensorFlow)""",
            icon: FontAwesomeIcons.hand,
            color: Colors.red,
          ),
          SizedBox(
            width: 30,
          ),
          Column(
            children: [
              SizedBox(
                height: 50,
              ),
              SquareTileDesktop(
                title: 'AirQRunner',
                description:
                    """• Developed an activity tracking app that suggests optimal running routes by avoiding highly polluted areas
    • Built the backend service using Flask, and Firebase, implementing a custom A*‑based pathfinding algorithm
    • Flutter imlementation integrating OpenStreetMaps""",
                icon: FontAwesomeIcons.personRunning,
                color: Colors.orange,
              ),
            ],
          ),
          SizedBox(
            width: 30,
          ),
          Column(
            children: [
              SizedBox(
                height: 50,
              ),
              SquareTileDesktop(
                title: 'RezerWith',
                description:
                    """• Worked within a team of 4 volunteers to develop a mobile application aimed at connecting small businesses with customers during the pandemic
                  • Used Dart and Flutter, with Google Firebase for managing user accounts and real‑time appointment updates""",
                icon: FontAwesomeIcons.shop,
                color: Colors.blue,
              ),
            ],
          ),
          SizedBox(
            width: 30,
          ),
          SquareTileDesktop(
            title: 'The Wine Shelf',
            description:
                """• Developed a React Native app that provides detailed wine information and pairing suggestions
              • Incorporated a label scanning feature for wine recognition
              • Integrated Firebase for storing user preferences, reviews, and personalized wine recommendations""",
            icon: FontAwesomeIcons.personRunning,
            color: Colors.orange,
          ),
        ],
      ),
    );
  }
}
