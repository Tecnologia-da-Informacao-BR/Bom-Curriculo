import 'package:bomcurriculo/util/Translation.dart';
import 'package:bomcurriculo/widget/WidgetButton.dart';
import 'package:flutter/material.dart';

import '../../controller/resume/ControllerGenerateResume.dart';
import '../../include/Body.dart';

class ViewGenerateResume extends StatefulWidget {
  const ViewGenerateResume({super.key});
  @override
  _ViewGenerateResume createState() => _ViewGenerateResume();
}

class _ViewGenerateResume extends State<ViewGenerateResume> {
  late final ControllerGenerateResume controller;

  @override
  void initState() {
    super.initState();
    controller = ControllerGenerateResume(() {
      if (mounted) setState(() {});
    });
    controller.init();
  }

  Widget buildCheckableItem({
    required Map<String, dynamic> item,
    required Widget content,
  }) {
    return GestureDetector(
      onTap: () => controller.toggleChecked(item),
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              item['checked']
                  ? Icons.check_box_outlined
                  : Icons.check_box_outline_blank,
            ),
            const SizedBox(width: 5),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFEEEEEE),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: content,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Body(
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 10),

              Center(
                child: Text(
                  Translation.instance.translate('Review resume'),
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),
              ),

              const SizedBox(height: 10),

              Center(
                child: Text(
                  '${Translation.instance.translate('AI has prepared a resume for you')}.\n${Translation.instance.translate('Select the information you want to keep before generating the resume')}',
                  style: TextStyle(fontWeight: FontWeight(700)),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 25),

              //======================
              // DADOS PESSOAIS
              //======================
              Text(
                Translation.instance.translate('Personal data'),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              Column(
                children: controller.personalData.map((personal) {
                  return buildCheckableItem(
                    item: personal,
                    content: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Translation.instance.translate(personal['title']),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(personal['value']),
                      ],
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),

              //======================
              // RESUMO
              //======================
              Text(
                Translation.instance.translate('Professional summary'),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              Column(
                children: controller.summary.map((item) {
                  return buildCheckableItem(
                    item: item,
                    content: Text(
                      item['description'],
                      style: const TextStyle(fontSize: 15),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),

              //======================
              // EXPERIÊNCIAS
              //======================
              Text(
                Translation.instance.translate('Professional experience'),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              Column(
                children: controller.experiences.map((experience) {
                  return buildCheckableItem(
                    item: experience,
                    content: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Translation.instance.translate(experience['title']),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(experience['company'] ?? ''),
                        const SizedBox(height: 3),
                        Text(
                          '${experience['date_start']} • ${experience['date_end']}',
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),

              //======================
              // FORMAÇÃO
              //======================
              Text(
                Translation.instance.translate('Education'),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              Column(
                children: controller.education.map((item) {
                  return buildCheckableItem(
                    item: item,
                    content: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Translation.instance.translate(item['title']),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(item['institution']),
                      ],
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),

              //======================
              // CURSOS
              //======================
              Text(
                Translation.instance.translate('Courses'),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              Column(
                children: controller.courses.map((course) {
                  return buildCheckableItem(
                    item: course,
                    content: Text(
                      Translation.instance.translate(course['title']),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),

              //======================
              // HABILIDADES
              //======================
              Text(
                Translation.instance.translate('Skills'),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              Column(
                children: controller.skills.map((skill) {
                  return buildCheckableItem(
                    item: skill,
                    content: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Translation.instance.translate(skill['title']),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text('${skill['years']} anos de experiência'),
                      ],
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),

              //======================
              // IDIOMAS
              //======================
              Text(
                Translation.instance.translate('Languages'),
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              Column(
                children: controller.languages.map((language) {
                  return buildCheckableItem(
                    item: language,
                    content: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          Translation.instance.translate(language['title']),
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Text(language['level']),
                      ],
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 30),

              GestureDetector(
                onTap: controller.generateResume,
                child: WidgetButton(
                  title: Translation.instance.translate('Generate resume'),
                ),
              ),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}