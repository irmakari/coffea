Pod::Spec.new do |s|
  s.name           = 'CoffeeSticker'
  s.version        = '1.0.0'
  s.summary        = 'Lifts the subject out of a coffee photo as a sticker'
  s.description    = 'Lifts the subject out of a coffee photo as a transparent PNG with Vision.'
  s.author         = 'irmakari'
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
