import 'package:bomcurriculo/include/Navbar.dart';
import 'package:bomcurriculo/util/Translation.dart';
import 'package:bomcurriculo/widget/WidgetButton.dart';
import 'package:bomcurriculo/widget/WidgetResume.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../controller/ControllerHome.dart';
import '../theme/AppColors.dart';

class ViewHome extends StatefulWidget {
  const ViewHome({super.key});
  @override
  State<ViewHome> createState() => _ViewHomeState();
}

class _ViewHomeState extends State<ViewHome> {
  late final ControllerHome controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerHome(() {
      if (mounted) setState(() {});
    });
    controller.init();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const Navbar(),
      body: controller.loading
          ? Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(30.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: TextSpan(
                            style: TextStyle(fontSize: 30, color: Colors.black),
                            children: [
                              TextSpan(
                                text:
                                    "${Translation.instance.translate('Welcome')}, ",
                                style: TextStyle(fontWeight: FontWeight(800)),
                              ),

                              TextSpan(
                                text: controller.name,
                                style: TextStyle(
                                  color: AppColorsLight.brandPrimary,
                                  fontWeight: FontWeight(800),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          Translation.instance.translate(
                            'Seus Currículos otimizados em um só lugar',
                          ),
                          style: TextStyle(fontWeight: FontWeight(700)),
                        ),

                        const SizedBox(height: 15),

                        Column(
                          children: controller.items.map((item) {
                            return WidgetResume(
                              type: item['type'] ?? "",
                              title: item['title'] ?? "",
                              subtitle: item['subtitle'] ?? "",
                              score: item['score'] ?? "",
                              downloadURL: item['downloadURL'] ?? "",
                            );
                          }).toList(),
                        ),

                        controller.items.length < 5
                            ? GestureDetector(
                                onTap: () {
                                  context.go("/resume/new-resume");
                                },
                                child: WidgetButton(
                                  title: Translation.instance.translate(
                                    'Generate new resume',
                                  ),
                                ),
                              )
                            : SizedBox(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
