import 'package:flutter/material.dart';

class ResonsiveLayout extends StatelessWidget {
  final Widget mobileScaffold;
  final Widget tabletScaffold;
  final Widget desktopScaffold;

  const ResonsiveLayout({
    super.key,
    required this.mobileScaffold,
    required this.tabletScaffold,
    required this.desktopScaffold,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constaints) {
        if (constaints.maxWidth < 500) {
          return mobileScaffold;
        } else if (constaints.maxWidth < 1000) {
          return tabletScaffold;
        } else {
          return desktopScaffold;
        }
      },
    );
  }
}
