import Foundation
import Vision
import PDFKit
import AppKit

let path = CommandLine.arguments[1]
let a = Int(CommandLine.arguments[2]) ?? 1
let b = Int(CommandLine.arguments[3]) ?? a
guard let doc = PDFDocument(url: URL(fileURLWithPath: path)) else { FileHandle.standardError.write("no pdf\n".data(using:.utf8)!); exit(1) }
let out = FileHandle.standardOutput
for pno in a...b {
  guard let page = doc.page(at: pno - 1) else { continue }
  let rect = page.bounds(for: .mediaBox)
  let scale: CGFloat = 2.0
  let img = NSImage(size: NSSize(width: rect.width*scale, height: rect.height*scale))
  img.lockFocus()
  NSColor.white.set(); NSRect(x:0,y:0,width:rect.width*scale,height:rect.height*scale).fill()
  let ctx = NSGraphicsContext.current!.cgContext
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  img.unlockFocus()
  guard let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  var lines: [[String: Any]] = []
  for obs in (req.results ?? []) {
    guard let top = obs.topCandidates(1).first else { continue }
    let bb = obs.boundingBox
    lines.append(["t": top.string, "x": bb.minX, "y": bb.minY, "w": bb.width, "h": bb.height])
  }
  if let data = try? JSONSerialization.data(withJSONObject: ["page": pno, "lines": lines]) {
    out.write(data); out.write("\n".data(using: .utf8)!)
  }
  FileHandle.standardError.write("p\(pno) ".data(using: .utf8)!)
}
