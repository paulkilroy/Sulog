import Foundation
import Vision
import AppKit

let path = CommandLine.arguments[1]
guard let img = NSImage(contentsOfFile: path),
      let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  FileHandle.standardError.write("cannot load image\n".data(using: .utf8)!); exit(1)
}
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
let handler = VNImageRequestHandler(cgImage: cg, options: [:])
try handler.perform([req])
var out: [[String: Any]] = []
for obs in (req.results ?? []) {
  guard let top = obs.topCandidates(1).first else { continue }
  let b = obs.boundingBox   // normalized, origin bottom-left
  out.append(["t": top.string, "x": b.minX, "y": b.minY, "w": b.width, "h": b.height])
}
let data = try JSONSerialization.data(withJSONObject: ["w": cg.width, "h": cg.height, "lines": out])
FileHandle.standardOutput.write(data)
