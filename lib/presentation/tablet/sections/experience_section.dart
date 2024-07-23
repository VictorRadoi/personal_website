import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:flutter_website/presentation/common/text_tile.dart';

class ExperienceSection extends StatelessWidget {
  const ExperienceSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 50, right: 50, top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TextTile(
            text1: 'GoParty, Romania - September 2023 - Present',
            text2: 'TECHNICAL PRODUCT OWNER',
            text3:
                """• Collaborated with founders to conceptualize and define the vision and roadmap for GoParty, an event ticketing solution, shaping the app’s core functionalities and user experience from the ground up
• Led the Beta testing phase, successfully coordinating 3 events with early adopters, resulting in a 85% positive feedback rate and actionable insights for product improvement
• Worked closely with founders, developers, and designers to ensure alignment on product goals and user experience
• Introduced agile practices, managing the product back log and facilitating sprint planning and daily stand‐ups. This improved team productivity and has so far reduced the projected time‐to‐market by 3 months""",
          ),
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
            text1: 'XOXNO, Romania - December 2023 - May 2024',
            text2: 'MOBILE DEVELOPMENT LEAD',
            text3:
                """• Oversaw the internal launch of the XOXNO mobile app, an NFT market place on the MultiversX blockchain
• Contributed to the implementation of new features, including a high‐impact cryptocurrency transfer feature that enable susers to securely transfer digital assets, integrating real‐time transactions and multi‐currency support
• Led the refactoring of the initial codebase, resulting in a 30% reduction in technical debt and a more scalable architecture
• Coordinated with UX/UI designers and backend developers to ensure alignment on product features and design""",
          ),
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
            text1: 'Teamboard, Romania - January 2021 - March 2023',
            text2: 'PROJECT LEAD',
            text3:
                """• Coordinated a small team of 5 and led the development of Teamboard, a sports club management platform
• Managed end-to-end product development, from initial concept through to launch, overseeing all phases including design, development, testing, and deployment.
• Was actively involved in the frontend development, implementing the main features of the application using Flutter
• Maintained communication with over 30 sports clubs and coaches to gather requirements and identify new features
• Led a product demonstration at the Romanian Basketball Federation’s 2022 Annual Conference, showcasing the application’s functions and securing its sale to a prominent sports club. The application quickly gained traction, surpassing 1,000 users at the time of sale""",
          ),
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
          const SizedBox(
            height: 15,
          ),
          const TextTile(
            text1: 'Evolution Labs, Romania - June 2021 - May 2022',
            text2: 'JUNIOR APPLICATION DEVELOPER',
            text3:
                """• Contributed to the development of the e-commerce application Carturesti, Romania’s largest online bookstore
• Worked closely with the UX team to translate AdobeXD mock‐ups into responsive Flutter components
• Developed a specialized Flutter application integrated with Zebra scanners, streamlining the process of managing and tracking book inventory, which lead to a 30% reduction stock management time
• Followed Scrum practices, participating in daily stand‐ups, sprint planning, and retrospectives""",
          ),
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
            text2: 'SOFTWARE DEVELOPER INTERN',
            text3:
                """• Designed and implemented a face filter application using advanced Augmented Reality (AR) techniques
• Received mentorship and guidance in Unity development and AR tools from experienced professionals
• Managed the project documentation, tracking technical challenges and solutions to support future development""",
          ),
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
          SelectableText(
            'Skills',
            style: ubuntu17blackBold,
          ),
          const SizedBox(
            height: 15,
          ),
          SizedBox(
            width: 600,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SelectableText(
                  'Data Analysis',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 5,
                ),
                SelectableText(
                  'Python (PyTorch, Pandas, NumPy), SQL, R',
                  style: ubuntu14black,
                ),
                const SizedBox(
                  height: 20,
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
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SelectableText(
                  'Data Visualization',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 5,
                ),
                SelectableText(
                  'Tableau, Microsoft Excel (advanced), PowerBI',
                  style: ubuntu14black,
                ),
                const SizedBox(
                  height: 20,
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
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SelectableText(
                  'Agile Software',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 5,
                ),
                SelectableText(
                  'Jira, Trello',
                  style: ubuntu14black,
                ),
                const SizedBox(
                  height: 20,
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
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SelectableText(
                  'Coding',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 5,
                ),
                SelectableText(
                  'Java, Dart, Flutter, ReactJS, Unity, C++',
                  style: ubuntu14black,
                ),
                const SizedBox(
                  height: 20,
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
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SelectableText(
                  'Other',
                  style: ubuntu17blackBold,
                ),
                const SizedBox(
                  width: 5,
                ),
                SelectableText(
                  'Data Modeling, Requirements Gathering & Documentation, Stakeholder Management, Wireframing, Presentation Skills',
                  style: ubuntu14black,
                ),
                const SizedBox(
                  height: 20,
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
        ],
      ),
    );
  }
}
