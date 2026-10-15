import CoreImage
import ExpoModulesCore
import Vision

// Lifts the subject of a coffee photo out of its background, the way a long
// press does in Photos, and keeps the result as a transparent PNG.
public class CoffeeStickerModule: Module {
  private let context = CIContext()

  public func definition() -> ModuleDefinition {
    Name("CoffeeSticker")

    // Resolves to the sticker's file URL, or nil when none can be made: an
    // older iOS, no clear subject, or a subject that is the whole picture.
    // Both outcomes are kept under `key`, so each photo is worked on once.
    AsyncFunction("stickerAsync") { (source: String, key: String, size: Double) -> String? in
      let file = try self.folder().appendingPathComponent(Self.fileName(key) + ".png")
      let none = file.appendingPathExtension("none")
      let manager = FileManager.default
      if manager.fileExists(atPath: file.path) { return file.absoluteString }
      if manager.fileExists(atPath: none.path) { return nil }

      guard let png = self.makeSticker(source: source, size: CGFloat(size)) else {
        manager.createFile(atPath: none.path, contents: nil)
        return nil
      }
      try png.write(to: file, options: .atomic)
      return file.absoluteString
    }
  }

  private func makeSticker(source: String, size: CGFloat) -> Data? {
    guard #available(iOS 17.0, *) else { return nil }
    guard let url = URL(string: source),
      let data = try? Data(contentsOf: url),
      let image = CIImage(data: data, options: [.applyOrientationProperty: true])
    else { return nil }

    let handler = VNImageRequestHandler(ciImage: image)
    let request = VNGenerateForegroundInstanceMaskRequest()
    guard (try? handler.perform([request])) != nil,
      let observation = request.results?.first,
      let buffer = try? observation.generateMaskedImage(
        ofInstances: observation.allInstances, from: handler, croppedToInstancesExtent: true)
    else { return nil }

    var sticker = CIImage(cvPixelBuffer: buffer)
    // A "subject" that fills the frame is the table or the whole scene, not a cup.
    let covered = (sticker.extent.width * sticker.extent.height) / (image.extent.width * image.extent.height)
    if covered > 0.85 { return nil }

    let scale = min(1, size / max(sticker.extent.width, sticker.extent.height))
    if scale < 1 {
      sticker = sticker.transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    }
    guard let space = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
    return context.pngRepresentation(of: sticker, format: .RGBA8, colorSpace: space)
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
