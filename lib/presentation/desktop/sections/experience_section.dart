import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:flutter_website/presentation/common/text_tile.dart';

class ExperienceSection extends StatelessWidget {
  const ExperienceSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 100, right: 100, top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TextTile(
              text1: 'Teamboard, Romania - January 2021 - March 2023',
              text2: 'Mobile Developer',
              text3:
                  """• Developed an application that enables sport clubs and teams to coordinate their sporting events. Designed features
such as team chat, interactive calendar and custom player profiles
• Cross-platform development using Flutter with a backend developed in NGINX, Flask, and SQL. Applied clean
architecture principles and design patterns (BloC)
• Led end-to-end product development as part of a small team, engaging with clients and incorporating multiple project
iterations to enhance user experience based on customer feedback"""),
          const SizedBox(
            height: 15,
          ),
          const SizedBox(
            width: 800,
            child: Divider(
              color: Colors.black,
              thickness: 1,
            ),
          ),
          const SizedBox(
            height: 15,
          ),
          const TextTile(
              text1:
                  'High-Tech Systems & Software Bucharest, Romania - April 2022 - July 2022',
              text2: 'Flutter Developer',
              text3:
                  """• Contributed to the development of cross platform applications using the Flutter framework. Worked on refactoring
existing projects by implementing state management and architectural patterns.
• Integrated RESTful APIs and third-party libraries to ensure smooth communication with the back-end services
• Utilized version control systems (Git) to manage source code and collaborated with team members using Agile
methodologies (Scrum)"""),
          const SizedBox(
            height: 15,
          ),
          const SizedBox(
            width: 800,
            child: Divider(
              color: Colors.black,
              thickness: 1,
            ),
          ),
          const SizedBox(
            height: 15,
          ),
          const TextTile(
              text1: 'Evolution Labs, Romania - June 2021 - April 2022',
              text2: 'Software Developer',
              text3:
                  """• Developed an application that enables sport clubs and teams to coordinate their sporting events. Designed features
such as team chat, interactive calendar and custom player profiles
• Cross-platform development using Flutter with a backend developed in NGINX, Flask, and SQL. Applied clean
architecture principles and design patterns (BloC)
• Led end-to-end product development as part of a small team, engaging with clients and incorporating multiple project
iterations to enhance user experience based on customer feedback"""),
          const SizedBox(
            height: 15,
          ),
          const SizedBox(
            width: 800,
            child: Divider(
              color: Colors.black,
              thickness: 1,
            ),
          ),
          const SizedBox(
            height: 15,
          ),
          const TextTile(
              text1: 'Evonomix, Romania - March 2020 - September 2020',
              text2: 'Mobile Developer',
              text3:
                  """• Developed a face filter application using Unity, ARCore and ARKit. Applied Augmented Reality techniques such
as marker-based AR and face tracking to overlay custom 3D models onto the user’s face in real time.
• Developed a movie portfolio application with an interface for searching, viewing, and managing movie data,
using a RESTful API to interact with a backend database"""),
          const SizedBox(
            height: 15,
          ),
          const SizedBox(
            width: 800,
            child: Divider(
              color: Colors.black,
              thickness: 1,
            ),
          ),
          const SizedBox(
            height: 15,
          ),
          Text(
            'Skills',
            style: ubuntu17blackBold,
          ),
          const SizedBox(
            height: 15,
          ),
          SizedBox(
            width: 600,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Flutter',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 20,
                ),
                const SizedBox(
                  height: 5,
                  width: 500,
                  child: LinearProgressIndicator(
                    backgroundColor: Colors.red,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.amber,
                    ),
                    value: 0.8,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(
            height: 20,
          ),
          SizedBox(
            width: 600,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Java',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 20,
                ),
                const SizedBox(
                  height: 5,
                  width: 500,
                  child: LinearProgressIndicator(
                    backgroundColor: Colors.red,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.amber,
                    ),
                    value: 0.7,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(
            height: 20,
          ),
          SizedBox(
            width: 600,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Python',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 20,
                ),
                const SizedBox(
                  height: 5,
                  width: 500,
                  child: LinearProgressIndicator(
                    backgroundColor: Colors.red,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.amber,
                    ),
                    value: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
