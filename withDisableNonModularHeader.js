const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withFixFirebaseIos = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      const marker = '# FIREBASE_IOS_FIX_V3';
      if (podfile.includes(marker)) {
        return config;
      }

      // The fix block to inject INSIDE the existing post_install
      const fixLines = `
  ${marker}
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |bc|
      # Fix: react-native-firebase C code incompatible with Xcode 16 strict C99
      bc.build_settings['GCC_WARN_INHIBIT_ALL_WARNINGS'] = 'YES'
      bc.build_settings['SWIFT_SUPPRESS_WARNINGS'] = 'YES'
      bc.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      # Suppress -Wimplicit-int being treated as error
      cflags = bc.build_settings['OTHER_CFLAGS'] || '$(inherited)'
      bc.build_settings['OTHER_CFLAGS'] = cflags + ' -w'
    end
  end`;

      if (podfile.includes('post_install do |installer|')) {
        // Inject our fix INSIDE the existing post_install block
        podfile = podfile.replace(
          'post_install do |installer|',
          `post_install do |installer|${fixLines}`
        );
      } else {
        // No existing post_install block - add one at the end
        podfile = podfile.trimEnd() + `\n\npost_install do |installer|\n${fixLines}\nend\n`;
      }

      fs.writeFileSync(podfilePath, podfile);
      return config;
    },
  ]);
};

module.exports = withFixFirebaseIos;
