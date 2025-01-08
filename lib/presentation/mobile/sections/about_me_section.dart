import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:universal_html/html.dart' as html;

class AboutMeSection extends StatelessWidget {
  const AboutMeSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          height: 1050,
          color: const Color(0xff08346c),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, top: 50),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Rădoi Victor-Andrei',
                style: ubuntu35white,
              ),
              const SizedBox(
                height: 30,
              ),
              Text(
                'Mobile Developer | Technical Product Manager',
                style: ubuntu17white,
              ),
              const SizedBox(
                height: 30,
              ),
              Text(
                """My journey began as a cross‑platform mobile developer, and as I grew more invested in building innovative applications, I pursued a Master’s
in AI to bring more intelligent features to my projects. During the past years, I’ve successfully launched 6 apps, including a large scale project
with 50,000+ downloads and an app I co‑founded for the National Basketball Federation. Having worked in fast‑paced startup environments,
I’ve played a key role in building several projects from the ground up, developing robust and scalable solutions with a strong focus on state
management, responsive design, and performance optimization.""",
                textAlign: TextAlign.justify,
                style: ubuntu14grey,
              ),
              const SizedBox(
                height: 30,
              ),
              Row(
                children: [
                  ElevatedButton(
                    onPressed: () {
                      html.window.open(
                        'https://www.linkedin.com/in/victorandreiradoi/',
                        'new tab',
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      shape: const CircleBorder(),
                      backgroundColor: Colors.white, // <-- Button color
                      foregroundColor: Colors.orange[800], // <-- Splash color
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Icon(
                        FontAwesomeIcons.linkedin,
                        size: 20,
                        color: Colors.orange[800],
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      html.window.open(
                        'https://github.com/VictorRadoi',
                        'new tab',
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      shape: const CircleBorder(),
                      backgroundColor: Colors.white, // <-- Button color
                      foregroundColor: Colors.orange[800], // <-- Splash color
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(8),
                      child: Icon(
                        FontAwesomeIcons.github,
                        size: 20,
                        color: Colors.orange[800],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(
                height: 30,
              ),
              Center(
                child: Image.asset(
                  'assets/images/eu.png',
                  height: 300,
                ),
              ),
              const SizedBox(
                height: 30,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
