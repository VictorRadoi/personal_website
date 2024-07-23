import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:flutter_website/presentation/common/section_header.dart';
import 'package:flutter_website/presentation/tablet/sections/achievements_section.dart';
import 'package:flutter_website/presentation/tablet/sections/education_section.dart';
import 'package:flutter_website/presentation/tablet/sections/experience_section.dart';
import 'package:flutter_website/presentation/tablet/sections/about_me_section.dart';
import 'package:flutter_website/presentation/tablet/sections/projects_section.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:universal_html/html.dart' as html;

class TabletScaffold extends StatefulWidget {
  const TabletScaffold({super.key});

  @override
  State<TabletScaffold> createState() => _TabletScaffoldState();
}

class _TabletScaffoldState extends State<TabletScaffold> {
  ScrollController scrollController = ScrollController();
  bool showbtn = false;

  final homeKey = GlobalKey();
  final experienceKey = GlobalKey();
  final educationeKey = GlobalKey();
  final projectsKey = GlobalKey();
  final achievementsKey = GlobalKey();

  void downloadFile(String url) {
    html.AnchorElement anchorElement = html.AnchorElement(href: url);
    anchorElement.download = 'Radoi Victor-Andrei CV.pdf';
    anchorElement.click();
  }

  @override
  void initState() {
    scrollController.addListener(() {
      double showoffset =
          10.0; //Back to top botton will show on scroll offset 10.0

      if (scrollController.offset > showoffset) {
        showbtn = true;
        setState(() {
          //update state
        });
      } else {
        showbtn = false;
        setState(() {
          //update state
        });
      }
    });
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(
          'Rădoi Victor-Andrei',
          style: ubuntu25white,
        ),
        backgroundColor: const Color(0xff08346c),
        actions: [
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
      backgroundColor: myDefaultBackground,
      drawer: Drawer(
        backgroundColor: Colors.grey[300],
        child: Column(
          children: [
            const SizedBox(
              height: 100,
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(homeKey.currentContext!);
                Navigator.pop(context);
              },
              leading: const Icon(FontAwesomeIcons.house),
              title: const Text('Home'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(experienceKey.currentContext!);
                Navigator.pop(context);
              },
              leading: const Icon(FontAwesomeIcons.briefcase),
              title: const Text('Experience'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(educationeKey.currentContext!);
                Navigator.pop(context);
              },
              leading: const Icon(FontAwesomeIcons.school),
              title: const Text('Edcucation'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(projectsKey.currentContext!);
                Navigator.pop(context);
              },
              leading: const Icon(FontAwesomeIcons.file),
              title: const Text('Projects'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(achievementsKey.currentContext!);
                Navigator.pop(context);
              },
              leading: const Icon(FontAwesomeIcons.trophy),
              title: const Text('Achievements'),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        controller: scrollController,
        child: Column(
          children: [
            Container(key: homeKey, child: const AboutMeSection()),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: experienceKey,
                child: const SectionHeader(text: 'Experience')),
            const SizedBox(
              height: 50,
            ),
            const ExperienceSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: educationeKey,
                child: const SectionHeader(text: 'Education')),
            const SizedBox(
              height: 50,
            ),
            const EducationSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: projectsKey, child: const SectionHeader(text: 'Projects')),
            const SizedBox(
              height: 50,
            ),
            const ProjectsSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: achievementsKey,
                child: const SectionHeader(text: 'Achievements')),
            const SizedBox(
              height: 50,
            ),
            const AchievementsSection(),
            const SizedBox(
              height: 100,
            ),
          ],
        ),
      ),
      floatingActionButton: AnimatedOpacity(
        duration: const Duration(milliseconds: 0),
        opacity: showbtn ? 1.0 : 0.0,
        child: FloatingActionButton(
          onPressed: () {
            scrollController.animateTo(0,
                duration: const Duration(milliseconds: 1000),
                curve: Curves.fastOutSlowIn);
          },
          backgroundColor: Colors.orange[800],
          child: const Icon(
            Icons.arrow_upward,
          ),
        ),
      ),
    );
  }
}
