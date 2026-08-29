import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../service/API.dart';
import '../../util/Translation.dart';

class Skill {
  final TextEditingController name = TextEditingController();
  final TextEditingController years = TextEditingController();

  void dispose() {
    name.dispose();
    years.dispose();
  }
}

class ControllerNewResume {
  ControllerNewResume(this._notify);

  /// callback pra view chamar setState quando o estado interno mudar
  final VoidCallback _notify;

  File? resumeFile;
  File? linkedinFile;
  String? resumeFileName;
  String? linkedinFileName;

  final controllerGitHubURL = TextEditingController();
  final controllerWebsiteURL = TextEditingController();
  final List<Skill> skills = [];

  Future<void> getTranslation() async {
    await Translation.instance.load("pt-BR");
    _notify();
  }

  void init() {
    getTranslation();
    addSkill();
  }

  void addSkill() {
    final skill = Skill();

    void normalizeSkills() {
      bool hasEmpty = false;

      for (int i = skills.length - 1; i >= 0; i--) {
        if (skills[i].name.text.trim().isEmpty) {
          if (hasEmpty) {
            skills[i].dispose();
            skills.removeAt(i);
          } else {
            hasEmpty = true;
          }
        }
      }

      if (!hasEmpty) {
        addSkill();
        return;
      }

      _notify();
    }

    skill.name.addListener(() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        normalizeSkills();
        if (skills.isNotEmpty &&
            identical(skill, skills.last) &&
            skill.name.text.trim().isNotEmpty) {
          addSkill();
        }
      });
    });

    skills.add(skill);
    _notify();
  }

  Future<void> pickResumeFile() async {
    final List<PlatformFile>? result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result == null || result.isEmpty) return;

    resumeFile = File(result.single.path!);
    resumeFileName = result.single.name;
    _notify();
  }

  Future<void> pickLinkedinFile() async {
    final List<PlatformFile>? result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
    );
    if (result == null || result.isEmpty) return;

    linkedinFile = File(result.single.path!);
    linkedinFileName = result.single.name;
    _notify();
  }

  Future<void> validateResume(BuildContext context) async {
    if (resumeFile == null || linkedinFile == null) {
      return;
    }

    final data = <String, String>{
      "github_link": controllerGitHubURL.text,
      "website_link": controllerWebsiteURL.text,
    };

    int skillIndex = 0;

    for (final skill in skills) {
      String name = skill.name.text.trim();
      if (name.isNotEmpty) {
        data["skills[$skillIndex][name]"] = name;
        data["skills[$skillIndex][years]"] = skill.years.text.trim();
        skillIndex++;
      }
    }

    var files = [
      {"field": "resume_cv", "path": resumeFile!.path},
      {"field": "resume_linkedin", "path": linkedinFile!.path},
    ];

    final response = await API().upload(
      "client/resumes/new-resume",
      data,
      files,
    );
    debugPrint(response.body);

    if (!context.mounted) return;
    context.go("/");
  }

  void dispose() {
    for (final skill in skills) {
      skill.dispose();
    }
    controllerGitHubURL.dispose();
    controllerWebsiteURL.dispose();
  }
}
