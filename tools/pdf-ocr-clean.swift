// pdf-ocr-range + horizontal-rule removal: erases long thin dark horizontal runs
// (underlines in the 1967 Wolff mimeo garble Vision's recognition of the Waray
// dialogue lines; removing them first recovers the text).
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
  let scale: CGFloat = 3.0
  let W = Int(rect.width*scale), H = Int(rect.height*scale)
  guard let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8, bytesPerRow: W,
                            space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue) else { continue }
  ctx.setFillColor(gray: 1, alpha: 1); ctx.fill(CGRect(x:0,y:0,width:W,height:H))
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  guard let data = ctx.data else { continue }
  let px = data.bindMemory(to: UInt8.self, capacity: W*H)
  // erase horizontal dark runs longer than minRun whose vertical thickness <= maxThick
  let minRun = Int(CGFloat(W) * 0.03)   // ~3% of page width
  let maxThick = Int(scale * 2.5)
  for y in 0..<H {
    var x = 0
    while x < W {
      if px[y*W+x] < 120 {
        var x2 = x
        while x2 < W && px[y*W+x2] < 120 { x2 += 1 }
        let run = x2 - x
        if run >= minRun {
          // check thickness at run midpoint
          let mx = (x + x2)/2
          var up = 0, dn = 0
          var yy = y-1; while yy >= 0 && px[yy*W+mx] < 120 { up += 1; yy -= 1 }
          yy = y+1; while yy < H && px[yy*W+mx] < 120 { dn += 1; yy += 1 }
          if up + dn + 1 <= maxThick {
            for ey in max(0,y-maxThick)...min(H-1,y+maxThick) {
              for ex in x..<x2 { if px[ey*W+ex] < 120 { px[ey*W+ex] = 255 } }
            }
          }
        }
        x = x2
      } else { x += 1 }
    }
  }
  guard let cg = ctx.makeImage() else { continue }
  let req = VNRecognizeTextRequest(); req.recognitionLevel = .accurate; req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  var lines: [[String: Any]] = []
  for obs in (req.results ?? []) {
    guard let top = obs.topCandidates(1).first else { continue }
    let bb = obs.boundingBox
    lines.append(["t": top.string, "x": bb.minX, "y": bb.minY, "w": bb.width, "h": bb.height])
  }
  if let d = try? JSONSerialization.data(withJSONObject: ["page": pno, "lines": lines]) {
    out.write(d); out.write("\n".data(using: .utf8)!)
  }
  FileHandle.standardError.write("p\(pno) ".data(using: .utf8)!)
}
