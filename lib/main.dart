import 'package:flutter/material.dart';
import 'package:flutter_website/presentation/desktop/desktop_scaffold.dart';
import 'package:flutter_website/presentation/mobile/mobile_scaffold.dart';
import 'package:flutter_website/responsive/responsive_layout.dart';
import 'package:flutter_website/presentation/tablet/tablet_scaffold.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      debugShowCheckedModeBanner: false,
      home: ResonsiveLayout(
        mobileScaffold: MobileScaffold(),
        tabletScaffold: TabletScaffold(),
        desktopScaffold: DesktopScaffold(),
      ),
    );
  }
}
