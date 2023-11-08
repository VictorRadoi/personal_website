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
          height: 1000,
          color: const Color(0xff08346c),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, top: 50),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Radoi Victor-Andrei',
                style: ubuntu35white,
              ),
              const SizedBox(
                height: 30,
              ),
              Text(
                'Software Engineer & Flutter Developer',
                style: ubuntu17white,
              ),
              const SizedBox(
                height: 30,
              ),
              Text(
                """I am a motivated software developer with over 2 years of industry experience. Throughout my career, I have worked on a variety of projects,
ranging from small-scale applications to enterprise-level solutions. I am passionate about mobile development and I constantly strive to learn
new technologies and keep up with the latest advancements in the field. This has led me to explore new domains such as data analytics and
artificial intelligence, which I have studied and leveraged in my work. With a strong drive to learn and innovate, I am excited to take on new
challenges and contribute to developing successful projects.""",
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
              SizedBox(
                height: 30,
              ),
              Center(
                child: Image.asset(
                  'assets/images/eu.png',
                  height: 300,
                ),
              ),
              SizedBox(
                height: 30,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
