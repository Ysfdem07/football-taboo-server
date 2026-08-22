const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFixFirebaseIos = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const marker = '# FIREBASE_IOS_FIX';
      if (podfile.includes(marker)) {
        return config;
      }

      const fixBlock = `
${marker}
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      config.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
      config.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
    end
  end
end
`;

      // If there is already a post_install block, merge INTO it instead of adding a new one
      if (podfile.includes('post_install do |installer|')) {
        podfile = podfile.replace(
          /post_install do \|installer\|/,
          `post_install do |installer| ${marker}
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config_setting|
      config_setting.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      config_setting.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
      config_setting.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
    end
  end`
        );
      } else {
        // No existing post_install, add one before the final "end"
        podfile = podfile.trimEnd() + '\n' + fixBlock;
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};

module.exports = withFixFirebaseIos;
