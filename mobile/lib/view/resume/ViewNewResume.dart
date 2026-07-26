import 'package:bomcurriculo/include/Body.dart';
import 'package:bomcurriculo/util/Translation.dart';
import 'package:bomcurriculo/widget/WidgetButton.dart';
import 'package:bomcurriculo/widget/WidgetInputText.dart';
import 'package:flutter/material.dart';

import '../../controller/resume/ControllerNewResume.dart';
import '../../widget/WidgetInputFile.dart';

class ViewNewResume extends StatefulWidget {
  const ViewNewResume({super.key});

  @override
  _ViewNewResume createState() => _ViewNewResume();
}

class _ViewNewResume extends State<ViewNewResume> {
  late final ControllerNewResume controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerNewResume(() {
      if (mounted) setState(() {});
    });
    controller.init();
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Body(
      child: Padding(
        padding: const EdgeInsets.all(45.0),
        child: Column(
          children: [
            Text(
              Translation.instance.translate(
                'Fill data correctly to generate your resume',
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 30.0),
            WidgetInputFile(
              title: Translation.instance.translate('Your resume/CV'),
              label: Translation.instance.translate('Choose a PDF file'),
              fileName: controller.resumeFileName,
              onTap: controller.pickResumeFile,
            ),
            WidgetInputFile(
              title: Translation.instance.translate('Linkedin resume'),
              label: Translation.instance.translate('Choose a PDF file'),
              fileName: controller.linkedinFileName,
              onTap: controller.pickLinkedinFile,
            ),
            WidgetInputText(
              title: Translation.instance.translate('GitHub URL'),
              controller: controller.controllerGitHubURL,
              httpsPrefix: 'https://github.com/',
            ),
            WidgetInputText(
              title: Translation.instance.translate('Your site URL'),
              controller: controller.controllerWebsiteURL,
              httpsPrefix: 'https://',
            ),

            Column(
              children: List.generate(controller.skills.length, (index) {
                return Row(
                  children: [
                    Expanded(
                      flex: 10,
                      child: WidgetInputText(
                        title: Translation.instance.translate('Skill'),
                        controller: controller.skills[index].name,
                      ),
                    ),
                    SizedBox(width: 5.0),
                    Expanded(
                      flex: 4,
                      child: WidgetInputText(
                        title: Translation.instance.translate('Years'),
                        controller: controller.skills[index].years,
                      ),
                    ),
                  ],
                );
              }),
            ),

            SizedBox(height: 15.0),

            GestureDetector(
              onTap: () => controller.validateResume(context),
              child: WidgetButton(
                title: Translation.instance.translate('Validate data'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}