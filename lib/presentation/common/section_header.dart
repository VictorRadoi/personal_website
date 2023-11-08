import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';

class SectionHeader extends StatelessWidget {
  final String text;
  const SectionHeader({super.key, required this.text});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Center(
          child: Text(
            text,
            style: ubuntu35black,
          ),
        ),
        const SizedBox(
          height: 10,
        ),
        const Center(
          child: SizedBox(
            height: 40,
            child: VerticalDivider(
              color: Colors.black,
              thickness: 2,
            ),
          ),
        ),
      ],
    );
  }
}
