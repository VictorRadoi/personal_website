import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';

class TextTile extends StatelessWidget {
  final String text1;
  final String text2;
  final String text3;
  const TextTile(
      {super.key,
      required this.text1,
      required this.text2,
      required this.text3});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(text1, style: ubuntu17blackBold),
        Text(
          text2,
          style: ubuntu14black,
        ),
        const SizedBox(
          height: 15,
        ),
        Text(
          text3,
          style: ubuntu14black,
        ),
      ],
    );
  }
}
