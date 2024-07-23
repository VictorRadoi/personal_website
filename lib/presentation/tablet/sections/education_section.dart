import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/text_tile.dart';

class EducationSection extends StatelessWidget {
  const EducationSection({super.key});

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(left: 50, right: 50, top: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextTile(
            text1:
                'Dublin City University, Dublin, Ireland - September 2022 - June 2023',
            text2: """Master's Degree in Artifical Intelligence""",
            text3:
                """• Core Modules: DataMining, DataVisualisation, Statistical Data Analysis, Machine Learning""",
          ),
          SizedBox(
            height: 15,
          ),
          SizedBox(
            width: 800,
            child: Divider(
              color: Colors.black,
              thickness: 1,
            ),
          ),
          SizedBox(
            height: 15,
          ),
          TextTile(
            text1:
                """King's College London, London, United Kingdom - September 2018 - June 2021""",
            text2: """Bachelor's Degree in Computer Science""",
            text3:
                """• Core Modules: Software Engineering, Database Systems, Object Oriented Design""",
          ),
        ],
      ),
    );
  }
}
