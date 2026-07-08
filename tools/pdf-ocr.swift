import Foundation
import Vision
import PDFKit
import AppKit

let path = CommandLine.arguments[1]
let pageNo = Int(CommandLine.arguments[2]) ?? 1
guard let doc = PDFDocument(url: URL(fileURLWithPath: path)), let page = doc.page(at: pageNo - 1) else {
  FileHandle.standardError.write("cannot open pdf/page\n".data(using: .utf8)!); exit(1)
}
let rect = page.bounds(for: .mediaBox)
let scale: CGFloat = 2.0
let img = NSImage(size: NSSize(width: rect.width*scale, height: rect.height*scale))
img.lockFocus()
NSColor.white.set(); NSRect(x:0,y:0,width:rect.width*scale,height:rect.height*scale).fill()
let ctx = NSGraphicsContext.current!.cgContext
ctx.scaleBy(x: scale, y: scale)
page.draw(with: .mediaBox, to: ctx)
img.unlockFocus()
guard let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { exit(1) }
let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
var out: [[String: Any]] = []
for obs in (req.results ?? []) {
  guard let top = obs.topCandidates(1).first else { continue }
  let b = obs.boundingBox
  out.append(["t": top.string, "x": b.minX, "y": b.minY, "w": b.width, "h": b.height])
}
let data = try JSONSerialization.data(withJSONObject: ["w": cg.width, "h": cg.height, "lines": out])
FileHandle.standardOutput.write(data)
