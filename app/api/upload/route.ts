import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

// Route segment config
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Maximal filstorlek (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Ingen fil tillhandahållen" }, { status: 400 })
    }

    // Kontrollera filstorlek
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Filen är för stor (max 5MB)" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Skapa unik filnamn med original filändelse
    const fileExtension = file.name.split(".").pop() || ""
    const uniqueId = uuidv4()
    const fileName = `${uniqueId}.${fileExtension}`

    // Säkerställ att documents-mappen existerar
    const documentsDir = join(process.cwd(), "public", "documents")
    await mkdir(documentsDir, { recursive: true })

    const filePath = join(documentsDir, fileName)

    try {
      await writeFile(filePath, buffer)
      console.log("File saved successfully:", filePath)

      return NextResponse.json({
        id: uniqueId,
        url: `/documents/${fileName}`,
      })
    } catch (writeError) {
      console.error("Error writing file:", writeError)
      return NextResponse.json({ error: "Kunde inte spara filen" }, { status: 500 })
    }
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Fel vid uppladdning av fil" }, { status: 500 })
  }
}

