import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/session';
import { redirect } from 'next/navigation';
import { writeFile } from 'fs/promises';
import path from 'path';
import Link from 'next/link';

export default function NewBook() {
  async function createManualBook(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const userId = user.userId;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;

    // Create book with one empty chapter and section
    const book = await prisma.book.create({
      data: {
        title,
        description,
        userId,
        chapters: {
          create: [
            {
              title: 'Chapter 1',
              order: 0,
              sections: {
                create: [
                  {
                    title: null,
                    content: {
                      type: 'doc',
                      content: [{ type: 'paragraph', content: [] }],
                    },
                    order: 0,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    redirect(`/dashboard/books/${book.id}/edit`);
  }

  async function createBookFromFile(formData: FormData) {
    'use server';
    const user = await requireAuth();
    const userId = user.userId;
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop()?.toLowerCase();
    let content = '';

    if (ext === 'pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      content = data.text;
    } else if (ext === 'docx') {
      const mammoth = (await import('mammoth')).default;
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
    } else if (ext === 'odt') {
      const AdmZip = (await import('adm-zip')).default;
      const zip = new AdmZip(buffer);
      const xml = zip.readAsText('content.xml');
      content = xml.replace(/<[^>]+>/g, '');
    } else {
      content = buffer.toString('utf-8');
    }

    // Simple text splitting: split by double newlines
    const paragraphs = content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Convert to Tiptap JSON sections
    const sections = paragraphs.map((text, index) => ({
      title: null,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text }],
          },
        ],
      },
      order: index,
    }));

    const book = await prisma.book.create({
      data: {
        title,
        userId,
        chapters: {
          create: [
            {
              title: 'Chapter 1',
              order: 0,
              sections: {
                create: sections.length > 0 ? sections : [
                  {
                    title: null,
                    content: {
                      type: 'doc',
                      content: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: content }],
                        },
                      ],
                    },
                    order: 0,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Optionally store original file
    const filename = `${Date.now()}_${file.name}`;
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);
    await writeFile(filePath, buffer);

    redirect(`/dashboard/books/${book.id}/edit`);
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/books" className="btn btn-ghost btn-sm">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold">Create New Book</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
        {/* Manual Creation */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Create Manually</h2>
            <p className="text-sm opacity-70">Start with an empty book and build it chapter by chapter</p>
            <form action={createManualBook} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Book Title</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter book title"
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description (Optional)</span>
                </label>
                <textarea
                  name="description"
                  placeholder="Brief description"
                  className="textarea textarea-bordered w-full h-20 resize-none"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Create Empty Book
              </button>
            </form>
          </div>
        </div>

        {/* File Import */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Import from File</h2>
            <p className="text-sm opacity-70">Upload PDF, DOCX, ODT, or TXT and we'll parse it for you</p>
            <form action={createBookFromFile} className="space-y-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Book Title</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter book title"
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">File</span>
                </label>
                <input
                  type="file"
                  name="file"
                  accept=".pdf,.docx,.odt,.txt"
                  className="file-input file-input-bordered w-full"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                Import & Create
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
