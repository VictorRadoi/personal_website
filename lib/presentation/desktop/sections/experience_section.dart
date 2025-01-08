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
            text1: 'GoParty, Romania - June 2024 - Present',
            text2: 'MOBILE DEVELOPER',
            text3:
                """• Drove the UI development of a Flutter based event ticketing platform, from the initial design through to its current beta release phase, contributing to different stages of the project including prototyping, user testing and bug fixing
• Designed the app architecture, implementing Riverpod for efficient state management
• Developed a ticket scanning app for event organizers, integrating real‑time backend verification and QR scanning
• Leveraged Retrofit and Dio to optimize network requests, implementing efficient caching which reduced API call latency and improved the speed of real‑time ticket validation""",
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
            text1: 'XOXNO, Romania - December 2023 - April 2024',
            text2: 'FLUTTER DEVELOPER (CONTRACT)',
            text3:
                """• Developed an NFT marketplace app supporting secure cryptocurrency transactions on the MultiversX blockchain
• Led a major refactoring initiative to transform a legacy codebase into a more scalable and maintainable architecture, leveraging Riverpod for state management and Freezed for immutable data modeling
• Enhanced routing efficiency and performance by implementing AutoRouter for seamless navigation and deep linking
• Developed various app features, including secure QR code scanning for encryption and decryption, splash screen animations for enhanced user onboarding, and SharedPreferences for persistent local storage""",
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
            text1: 'Teamboard, Romania - May 2022 - August 2023',
            text2: 'PROJECT LEAD',
            text3:
                """• Coordinated a cross‑functional team of 5, leading the design and development of a sports club management platform
• Served as the sole Flutter developer, implementing key features such as a dynamic calendar with notification integration, an in‑app chat system and a custom user dashboard for managing team activities and schedules
• Improved scalability by restructuring the code with Clean Architecture, and used Flutter Bloc for managing real‑time updates like scheduling and notifications
• Successfully led a product demonstration at the Romanian Basketball Federation’s 2022 Annual Conference, securing partnerships with multiple sports clubs
• Managed the full product development lifecycle, from conceptualizing features to the public release. Worked closely with sports clubs and coaches, gathering feedback, implementing new feature requests, and addressing bug fixes""",
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
                """• Worked on developing the mobile application for Carturesti, Romania’s largest bookshop, now exceeding 50,000 downloads
• Collaborated with the UX team to translate Adobe XD mockups into custom Flutter widgets
• Focused on UI/UX development, utilizing Flutter’s Material Design library and custom responsive layouts
• Built a internal application integrated with Zebra scanners, streamlining inventory management and book tracking processes for store operations
• Followed Scrum practices, participating in daily stand‑ups, sprint planning, and retrospectives""",
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
            text1: 'Evonomix, Romania - Jun 2020 - September 2020',
            text2: 'SOFTWARE DEVELOPER INTERN',
            text3:
                """• Individually designed and developed a cross‑platform face filter application with real‑time facial tracking
• Integrated Unity with Flutter using platform channels via the flutter_unity_widget
• Created and embedded Unity scenes, leveraging Unity’s AR Foundation for facial detection and real‑time AR effects""",
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
