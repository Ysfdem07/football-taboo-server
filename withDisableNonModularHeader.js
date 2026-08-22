const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withDisableNonModularHeader = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfile = fs.readFileSync(podfilePath, 'utf8');

      // Add a post_install hook to set CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES to YES
      const postInstallHook = `
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
end
`;

      if (!podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        // Find existing post_install or append
        if (podfile.includes('post_install do |installer|')) {
          podfile = podfile.replace(
            'post_install do |installer|',
            'post_install do |installer|\n  installer.pods_project.targets.each do |target|\n    target.build_configurations.each do |config|\n      config.build_settings[\'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES\'] = \'YES\'\n    end\n  end'
          );
        } else {
          podfile += postInstallHook;
        }
        fs.writeFileSync(podfilePath, podfile);
      }
      return config;
    },
  ]);
};

module.exports = withDisableNonModularHeader;
