import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:universal_html/html.dart' as html;

class AboutMeSection extends StatelessWidget {
  const AboutMeSection({super.key});

  @override
  Widget build(BuildContext context) {
    bool isScreenWide = MediaQuery.of(context).size.width >= 800;
    return Stack(
      children: [
        Container(
          height: 550,
          color: const Color(0xff08346c),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 20, right: 20, top: 50),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rădoi Victor-Andrei',
                        style: ubuntu25white,
                      ),
                      const SizedBox(
                        height: 30,
                      ),
                      Text(
                        'Software Developer | Technical Product Manager',
                        style: ubuntu17white,
                      ),
                      const SizedBox(
                        height: 30,
                      ),
                      SizedBox(
                        width: isScreenWide ? 500 : 300,
                        child: Text(
                          """I am software professional with over 3 years of experience across diverse projects, ranging from mobile applications 
                          to specialized software solutions. As my career has progressed, I’ve increasingly taken on leadership responsibilities, 
                          discovering a natural aptitude for guiding teams, refining processes, and driving projects to success. With a solid foundation 
                          in technology and a growing passion for business and management, I’m eager to transition into roles where I have the opportunity 
                          to blend these skills effectively.""",
                          textAlign: TextAlign.left,
                          style: ubuntu14grey,
                        ),
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
                              foregroundColor:
                                  Colors.orange[800], // <-- Splash color
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
                              foregroundColor:
                                  Colors.orange[800], // <-- Splash color
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
                    ],
                  ),
                  Image.asset(
                    'assets/images/eu.png',
                    height: 300,
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
