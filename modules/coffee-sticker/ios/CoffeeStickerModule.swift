import CoreImage
import ExpoModulesCore
import Vision

// Lifts the subject of a coffee photo out of its background, the way a long
// press does in Photos, and keeps the result as a transparent PNG.
// What became of one photo. Only `none` is a lasting answer; a photo that
// could not be read or worked on is tried again next time.
private enum Outcome {
  case sticker(Data)
  case none
  case failed
}

public class CoffeeStickerModule: Module {
  private let context = CIContext()

  public func definition() -> ModuleDefinition {
    Name("CoffeeSticker")

    // Resolves to the sticker's file URL, or nil when none can be made: an
    // older iOS, no clear subject, or a subject that is the whole picture.
    // Both outcomes are kept under `key`, so each photo is worked on once.
    AsyncFunction("stickerAsync") { (source: String, key: String, size: Double) -> String? in
      let file = try self.folder().appendingPathComponent(Self.fileName(key) + ".png")
      // Versioned, so photos turned down by an earlier, stricter check are
      // tried again.
      let none = file.appendingPathExtension("none2")
      let manager = FileManager.default
      if manager.fileExists(atPath: file.path) { return file.absoluteString }
      if manager.fileExists(atPath: none.path) { return nil }

      switch self.makeSticker(source: source, size: CGFloat(size)) {
      case .sticker(let png):
        try png.write(to: file, options: .atomic)
        return file.absoluteString
      case .none:
        manager.createFile(atPath: none.path, contents: nil)
        return nil
      case .failed:
        return nil
      }
    }
  }

  private func makeSticker(source: String, size: CGFloat) -> Outcome {
    guard #available(iOS 17.0, *) else { return .none }
    // A photo that did not download, or Vision refusing to run (as it does in
    // the Simulator), says nothing about the photo itself.
    guard let url = URL(string: source),
      let data = try? Data(contentsOf: url),
      let image = CIImage(data: data, options: [.applyOrientationProperty: true])
    else { return .failed }

    let handler = VNImageRequestHandler(ciImage: image)
    let request = VNGenerateForegroundInstanceMaskRequest()
    guard (try? handler.perform([request])) != nil else { return .failed }
    guard let observation = request.results?.first else { return .none }
    guard let buffer = try? observation.generateMaskedImage(
      ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: true)
    else { return .failed }

    var sticker = CIImage(cvPixelBuffer: buffer)
    // A "subject" that runs edge to edge both ways is the table or the whole
    // scene, not a cup. A cup photographed close up from above fills most of
    // the frame too, but its round edge leaves the corners, so only a cut-out
    // that reaches all four sides is turned down.
    let wide = sticker.extent.width / image.extent.width
    let tall = sticker.extent.height / image.extent.height
    if wide > 0.97 && tall > 0.97 { return .none }

    let scale = min(1, size / max(sticker.extent.width, sticker.extent.height))
    if scale < 1 {
      sticker = sticker.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    }
    guard let space = CGColorSpace(name: CGColorSpace.sRGB),
      let png = context.pngRepresentation(of: sticker, format: .RGBA8, colorSpace: space)
    else { return .failed }
    return .sticker(png)
  }

  private func folder() throws -> URL {
    let caches = try FileManager.default.url(
      for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    let folder = caches.appendingPathComponent("coffee-stickers", isDirectory: true)
    try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    return folder
  }

  // Storage paths and file URLs, reduced to something safe as a file name.
  private static func fileName(_ key: String) -> String {
    String(key.map { $0.isLetter || $0.isNumber ? $0 : "-" }.suffix(120))
  }
}
