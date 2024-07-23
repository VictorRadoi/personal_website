import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:universal_html/html.dart' as html;

class AboutMeSection extends StatelessWidget {
  final GlobalKey experienceKey;
  final GlobalKey educationKey;
  final GlobalKey projectsKey;
  final GlobalKey achievementsKey;
  const AboutMeSection({
    super.key,
    required this.experienceKey,
    required this.educationKey,
    required this.projectsKey,
    required this.achievementsKey,
  });

  void downloadFile(String url) {
    html.AnchorElement anchorElement = html.AnchorElement(href: url);
    anchorElement.download = 'Rădoi Victor-Andrei CV.pdf';
    anchorElement.click();
  }

  @override
  Widget build(BuildContext context) {
    bool isScreenWide = MediaQuery.of(context).size.width >= 1060;
    return Stack(
      children: [
        Container(
          height: 650,
          color: const Color(0xff08346c),
        ),
        Padding(
          padding: const EdgeInsets.only(left: 100, right: 100, top: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  SelectableText(
                    'Rădoi Victor-Andrei',
                    style: ubuntu25white,
                  ),
                  SizedBox(
                    width: 500,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Home', style: ubuntu14white),
                        TextButton(
                            onPressed: () {
                              Scrollable.ensureVisible(
                                  experienceKey.currentContext!);
                            },
                            child: Text('Experience', style: ubuntu14white)),
                        TextButton(
                            onPressed: () {
                              Scrollable.ensureVisible(
                                  educationKey.currentContext!);
                            },
                            child: Text('Education', style: ubuntu14white)),
                        TextButton(
                            onPressed: () {
                              Scrollable.ensureVisible(
                                  projectsKey.currentContext!);
                            },
                            child: Text('Projects', style: ubuntu14white)),
                        TextButton(
                          onPressed: () {
                            Scrollable.ensureVisible(
                                achievementsKey.currentContext!);
                          },
                          child: Text('Achievements', style: ubuntu14white),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      downloadFile('assets/files/CV.pdf');
                    },
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.all(
                          Radius.circular(15),
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(10.0),
                        child: Text('Download CV', style: ubuntu14black),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(
                height: 130,
              ),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SelectableText(
                        'Rădoi Victor-Andrei',
                        style: ubuntu35white,
                      ),
                      const SizedBox(
                        height: 30,
                      ),
                      SelectableText(
                        'Software Engineer',
                        style: ubuntu17white,
                      ),
                      const SizedBox(
                        height: 30,
                      ),
                      SizedBox(
                        width: 550,
                        child: SelectableText(
                          """I am software professional with over 3 years of experience across diverse projects, ranging from mobile applications to specialized software solutions. As my career has progressed, I’ve increasingly taken on leadership responsibilities, discovering a natural aptitude for guiding teams, refining processes, and driving projects to success. With a solid foundation in technology and a growing passion for business and management, I’m eager to transition into roles where I have the opportunity to blend these skills effectively.""",
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
                    height: 400,
                  ),
                  isScreenWide
                      ? const SizedBox(
                          width: 100,
                        )
                      : const SizedBox(),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}
