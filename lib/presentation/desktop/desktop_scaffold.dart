import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/section_header.dart';
import 'package:flutter_website/presentation/desktop/sections/about_me_section.dart';
import 'package:flutter_website/presentation/desktop/sections/achievements_section.dart';
import 'package:flutter_website/presentation/desktop/sections/education_section.dart';
import 'package:flutter_website/presentation/desktop/sections/experience_section.dart';
import 'package:flutter_website/presentation/desktop/sections/projects_section.dart';

class DesktopScaffold extends StatefulWidget {
  const DesktopScaffold({super.key});

  @override
  State<DesktopScaffold> createState() => _DesktopScaffoldState();
}

class _DesktopScaffoldState extends State<DesktopScaffold> {
  ScrollController scrollController = ScrollController();
  bool showButton = false;
  final experienceKey = GlobalKey();
  final educationKey = GlobalKey();
  final projectsKey = GlobalKey();
  final achievementsKey = GlobalKey();

  @override
  void initState() {
    scrollController.addListener(() {
      double showOffset = 10.0;

      if (scrollController.offset > showOffset) {
        showButton = true;
        setState(() {
          //update state
        });
      } else {
        showButton = false;
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
      body: SingleChildScrollView(
        controller: scrollController,
        child: Column(
          children: [
            AboutMeSection(
              experienceKey: experienceKey,
              educationKey: educationKey,
              projectsKey: projectsKey,
              achievementsKey: achievementsKey,
            ),
            const SizedBox(
              height: 50,
            ),
            Container(
              key: experienceKey,
              child: const SectionHeader(
                text: 'Experience',
              ),
            ),
            const SizedBox(
              height: 50,
            ),
            const ExperienceSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
              key: educationKey,
              child: const SectionHeader(
                text: 'Education',
              ),
            ),
            const SizedBox(
              height: 50,
            ),
            const EducationSection(),
            const SizedBox(
              height: 100,
            ),
            Container(
              key: projectsKey,
              child: const SectionHeader(
                text: 'Projects',
              ),
            ),
            const SizedBox(
              height: 50,
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 150),
              child: ProjectsSection(),
            ),
            const SizedBox(
              height: 100,
            ),
            Container(
              key: achievementsKey,
              child: const SectionHeader(
                text: 'Achievements',
              ),
            ),
            const SizedBox(
              height: 50,
            ),
            const AchievementsSection(),
            const SizedBox(
              height: 150,
            ),
          ],
        ),
      ),
      floatingActionButton: AnimatedOpacity(
        duration: const Duration(milliseconds: 0),
        opacity: showButton ? 1.0 : 0.0,
        child: FloatingActionButton(
          onPressed: () {
            scrollController.animateTo(0,
                duration: const Duration(milliseconds: 1000),
                curve: Curves.fastOutSlowIn);
          },
          backgroundColor: Colors.orange[800],
          child: const Icon(Icons.arrow_upward),
        ),
      ),
    );
  }
}
