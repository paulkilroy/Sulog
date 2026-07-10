// Render PDF pages to PNG files (2x scale). Usage: swift tools/pdf-render.swift <pdf> <from> <to> <outdir>
import Foundation
import PDFKit
import AppKit

let path = CommandLine.arguments[1]
let a = Int(CommandLine.arguments[2]) ?? 1
let b = Int(CommandLine.arguments[3]) ?? a
let outDir = CommandLine.arguments[4]
guard let doc = PDFDocument(url: URL(fileURLWithPath: path)) else { FileHandle.standardError.write("no pdf\n".data(using:.utf8)!); exit(1) }
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
  guard let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil),
        let png = NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:]) else { continue }
  try? png.write(to: URL(fileURLWithPath: "\(outDir)/page_\(pno).png"))
  FileHandle.standardError.write("p\(pno) ".data(using: .utf8)!)
}
