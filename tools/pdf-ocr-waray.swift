// Vision OCR tuned for the Wolff 1967 Waray mimeo:
//   accurate + language correction + Waray dictionary as customWords
//   (correction OFF garbles typewriter mixed-language lines; ON with the
//    dictionary recovers accented Waray nearly perfectly — tested p137 v1).
// usage: swift pdf-ocr-waray.swift <pdf> <from> <to> <wordlist> > out.jsonl
import Foundation
import Vision
import PDFKit
import AppKit

let path = CommandLine.arguments[1]
let a = Int(CommandLine.arguments[2]) ?? 1
let b = Int(CommandLine.arguments[3]) ?? a
let wordlist = (try? String(contentsOfFile: CommandLine.arguments[4], encoding: .utf8))?
  .split(separator: "\n").map(String.init) ?? []
guard let doc = PDFDocument(url: URL(fileURLWithPath: path)) else { exit(1) }
let out = FileHandle.standardOutput
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = true
req.customWords = wordlist
for pno in a...b {
  guard let page = doc.page(at: pno - 1) else { continue }
  let rect = page.bounds(for: .mediaBox)
  let scale: CGFloat = 3.0
  let W = Int(rect.width*scale), H = Int(rect.height*scale)
  guard let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W,
                            space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { continue }
  ctx.setFillColor(gray: 1, alpha: 1); ctx.fill(CGRect(x:0,y:0,width:W,height:H))
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  guard let cg = ctx.makeImage() else { continue }
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  var lines: [[String: Any]] = []
  for obs in (req.results ?? []) {
    guard let top = obs.topCandidates(1).first else { continue }
    let bb = obs.boundingBox
    lines.append(["t": top.string, "x": bb.minX, "y": bb.minY, "w": bb.width, "h": bb.height, "c": top.confidence])
  }
  if let d = try? JSONSerialization.data(withJSONObject: ["page": pno, "lines": lines]) {
    out.write(d); out.write("\n".data(using: .utf8)!)
  }
  FileHandle.standardError.write("p\(pno) ".data(using: .utf8)!)
}
