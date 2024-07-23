import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/common/constants.dart';

class SquareTileDesktop extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;
  const SquareTileDesktop({
    super.key,
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 200,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(shape: BoxShape.circle, color: color),
            child: Center(
              child: Icon(
                icon,
                size: 20,
                color: Colors.white,
              ),
            ),
          ),
          const SizedBox(
            height: 20,
          ),
          SelectableText(
            title,
            style: ubuntu17blackBold,
          ),
          const SizedBox(
            height: 10,
          ),
          SelectableText(
            description,
            style: ubuntu14black,
          ),
        ],
      ),
    );
  }
}
