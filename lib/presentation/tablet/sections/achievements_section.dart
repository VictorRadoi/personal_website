import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class AchievementsSection extends StatelessWidget {
  const AchievementsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 50, right: 50, top: 20),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            height: 550,
            width: 400,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.green,
                width: 2,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                children: [
                  const SizedBox(
                    height: 10,
                  ),
                  SelectableText(
                    'Licences and Certifications',
                    style: ubuntu17blackBold,
                  ),
                  const SizedBox(
                    height: 50,
                  ),
                  Row(
                    children: [
                      const Icon(
                        FontAwesomeIcons.certificate,
                      ),
                      const SizedBox(
                        width: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Microsoft Business Analyst Professional Certificate',
                          style: ubuntu17blackBold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 50,
                  ),
                  Row(
                    children: [
                      const Icon(
                        FontAwesomeIcons.certificate,
                      ),
                      const SizedBox(
                        width: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Agile Requirements Foundations',
                          style: ubuntu17blackBold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 50,
                  ),
                  Row(
                    children: [
                      const Icon(
                        FontAwesomeIcons.certificate,
                      ),
                      const SizedBox(
                        width: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Requirements Elicitation and Analysis',
                          style: ubuntu17blackBold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 50,
                  ),
                  Row(
                    children: [
                      const Icon(
                        FontAwesomeIcons.certificate,
                      ),
                      const SizedBox(
                        width: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Project Management Foundations: Small Projects',
                          style: ubuntu17blackBold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 50,
                  ),
                  Row(
                    children: [
                      const Icon(
                        FontAwesomeIcons.certificate,
                      ),
                      const SizedBox(
                        width: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Master Clean Architecture in Flutter',
                          style: ubuntu17blackBold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(
            height: 50,
          ),
          Container(
            height: 550,
            width: 400,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: Colors.yellow,
                width: 2,
              ),
            ),
            child: Padding(
              padding: const EdgeInsets.all(15),
              child: Column(
                children: [
                  const SizedBox(
                    height: 50,
                  ),
                  SelectableText(
                    'Academic Achievements',
                    style: ubuntu17blackBold,
                  ),
                  const SizedBox(
                    height: 50,
                  ),
                  Row(
                    children: [
                      const Icon(
                        FontAwesomeIcons.trophy,
                      ),
                      const SizedBox(
                        width: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'PwC Academic Awards Winner (March 2024)',
                          style: ubuntu17blackBold,
                        ),
                      ),
                      const SizedBox(
                        height: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Was awarded first place and received a monetary award for the best MSc Computing Practicum',
                          style: ubuntu14black,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(
                    height: 50,
                  ),
                  Row(
                    children: [
                      const Icon(
                        FontAwesomeIcons.trophy,
                      ),
                      const SizedBox(
                        width: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Credit Suisse Coding Challenge (October 2019)',
                          style: ubuntu17blackBold,
                        ),
                      ),
                      const SizedBox(
                        height: 20,
                      ),
                      Flexible(
                        child: SelectableText(
                          'Ranked top 20 out of over 200 participants',
                          style: ubuntu14black,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
