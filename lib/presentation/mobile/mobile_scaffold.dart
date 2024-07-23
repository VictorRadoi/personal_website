import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';
import 'package:flutter_website/presentation/common/section_header.dart';
import 'package:flutter_website/presentation/mobile/sections/about_me_section.dart';
import 'package:flutter_website/presentation/mobile/sections/achievements_section.dart';
import 'package:flutter_website/presentation/mobile/sections/education_section.dart';
import 'package:flutter_website/presentation/mobile/sections/experience_section.dart';
import 'package:flutter_website/presentation/mobile/sections/projects_section.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:universal_html/html.dart' as html;

class MobileScaffold extends StatefulWidget {
  const MobileScaffold({super.key});

  @override
  State<MobileScaffold> createState() => _MobileScaffoldState();
}

class _MobileScaffoldState extends State<MobileScaffold> {
  ScrollController scrollController = ScrollController();
  bool showbtn = false;

  final experienceKey = GlobalKey();
  final educationKey = GlobalKey();
  final projectsKey = GlobalKey();
  final achievementsKey = GlobalKey();

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

  void downloadFile(String url) {
    html.AnchorElement anchorElement = html.AnchorElement(href: url);
    anchorElement.download = 'Radoi Victor-Andrei CV.pdf';
    anchorElement.click();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Text(
          'Rădoi Victor-Andrei',
          style: ubuntu17whiteBold,
        ),
        backgroundColor: const Color(0xff08346c),
      ),
      backgroundColor: Colors.white,
      drawer: Drawer(
        child: ListView(
          children: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Align(
                alignment: Alignment.topLeft,
                child: IconButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                    },
                    icon: const Icon(Icons.close)),
              ),
            ),
            const SizedBox(
              height: 100,
            ),
            const ListTile(
              leading: Icon(FontAwesomeIcons.house),
              title: Text('Home'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(experienceKey.currentContext!);
                Navigator.of(context).pop();
              },
              leading: const Icon(FontAwesomeIcons.briefcase),
              title: const Text('Experience'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(educationKey.currentContext!);
                Navigator.of(context).pop();
              },
              leading: const Icon(FontAwesomeIcons.school),
              title: const Text('Edcucation'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(projectsKey.currentContext ?? context);
                Navigator.of(context).pop();
              },
              leading: const Icon(FontAwesomeIcons.file),
              title: const Text('Projects'),
            ),
            ListTile(
              onTap: () {
                Scrollable.ensureVisible(
                    achievementsKey.currentContext ?? context);
                Navigator.of(context).pop();
              },
              leading: const Icon(FontAwesomeIcons.trophy),
              title: const Text('Achievements'),
            ),
            const SizedBox(
              height: 30,
            ),
            TextButton(
              onPressed: () {
                downloadFile('assets/files/CV.pdf');
              },
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xff08346c),
                  borderRadius: BorderRadius.all(
                    Radius.circular(15),
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(10.0),
                  child: Text('Download CV', style: ubuntu14white),
                ),
              ),
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        controller: scrollController,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AboutMeSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: experienceKey,
                child: const SectionHeader(text: 'Experience')),
            const ExperienceSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: educationKey,
                child: const SectionHeader(text: 'Education')),
            const SizedBox(
              height: 20,
            ),
            const EducationSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: projectsKey, child: const SectionHeader(text: 'Projects')),
            const SizedBox(
              height: 20,
            ),
            const ProjectsSection(),
            const SizedBox(
              height: 50,
            ),
            Container(
                key: achievementsKey,
                child: const SectionHeader(text: 'Achievements')),
            const SizedBox(
              height: 20,
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
        opacity: showbtn ? 1 : 0,
        child: SizedBox(
          height: 50,
          width: 50,
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
      ),
    );
  }
}
