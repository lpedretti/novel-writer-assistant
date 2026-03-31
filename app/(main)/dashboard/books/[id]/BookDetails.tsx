'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { HEADING_FONTS, SUBHEADING_FONTS, BODY_FONTS, SYSTEM_FONTS, getFontById } from '@/lib/fonts';

interface BookDetailsProps {
  book: {
    id: number;
    title: string;
    description: string | null;
    styleConfig: Record<string, unknown> | null;
    chapterCount: number;
  };
  updateBookSettings: (formData: FormData) => Promise<void>;
}

export function BookDetails({ book, updateBookSettings }: BookDetailsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(book.title);
  const [description, setDescription] = useState(book.description || '');
  const [styleConfig, setStyleConfig] = useState(
    book.styleConfig || {
      h1Font: 'serif',
      h2Font: 'serif',
      h3Font: 'serif',
      bodyFont: 'sans-serif',
      blockquoteFont: 'serif',
    }
  );
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('styleConfig', JSON.stringify(styleConfig));

    startTransition(() => {
      updateBookSettings(formData).then(() => {
        setIsEditing(false);
      });
    });
  };

  const handleCancel = () => {
    setTitle(book.title);
    setDescription(book.description || '');
    setStyleConfig(
      book.styleConfig || {
        h1Font: 'serif',
        h2Font: 'serif',
        h3Font: 'serif',
        bodyFont: 'sans-serif',
        blockquoteFont: 'serif',
      }
    );
    setIsEditing(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/books" className="btn btn-ghost btn-sm">
          ← Back to Books
        </Link>
        <h1 className="text-3xl font-bold">
          <span className="italic">"{book.title}"</span> Book Details
        </h1>
        <Link href={`/dashboard/books/${book.id}/edit`} className="btn btn-primary btn-sm">
          Edit Book Content
        </Link>
      </div>

      {/* Book Settings Section Header */}
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold">Book Settings</h2>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-primary">
            Edit Settings
          </button>
        )}
      </div>

      {/* Book Information Card */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">

          {isEditing ? (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Book Information</h3>

                {/* Title */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Title</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-32 resize-none"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of your book"
                  />
                </div>
              </div>

              {/* Right Column - Font Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Font Configuration</h3>

                {/* H1 Font */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Chapter Titles Font</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={(styleConfig as { h1Font?: string }).h1Font || 'serif'}
                    onChange={(e) => setStyleConfig({ ...styleConfig, h1Font: e.target.value })}
                  >
                    <optgroup label="Chapter Title Fonts">
                      {HEADING_FONTS.map((font) => (
                        <option key={font.id} value={font.id} style={{ fontFamily: font.fallback }}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="System Fonts">
                      {SYSTEM_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* H2 Font */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Section Headings Font</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={(styleConfig as { h2Font?: string }).h2Font || 'serif'}
                    onChange={(e) => setStyleConfig({ ...styleConfig, h2Font: e.target.value })}
                  >
                    <optgroup label="Section Heading Fonts">
                      {SUBHEADING_FONTS.map((font) => (
                        <option key={font.id} value={font.id} style={{ fontFamily: font.fallback }}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="System Fonts">
                      {SYSTEM_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* H3 Font */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Subsection Headings Font</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={(styleConfig as { h3Font?: string }).h3Font || 'serif'}
                    onChange={(e) => setStyleConfig({ ...styleConfig, h3Font: e.target.value })}
                  >
                    <optgroup label="Subsection Heading Fonts">
                      {SUBHEADING_FONTS.map((font) => (
                        <option key={font.id} value={font.id} style={{ fontFamily: font.fallback }}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="System Fonts">
                      {SYSTEM_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Body Font */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Paragraph Text Font</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={(styleConfig as { bodyFont?: string }).bodyFont || 'sans-serif'}
                    onChange={(e) => setStyleConfig({ ...styleConfig, bodyFont: e.target.value })}
                  >
                    <optgroup label="Body Text Fonts">
                      {BODY_FONTS.map((font) => (
                        <option key={font.id} value={font.id} style={{ fontFamily: font.fallback }}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="System Fonts">
                      {SYSTEM_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Blockquote Font */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Blockquote Font</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={(styleConfig as { blockquoteFont?: string }).blockquoteFont || 'serif'}
                    onChange={(e) => setStyleConfig({ ...styleConfig, blockquoteFont: e.target.value })}
                  >
                    <optgroup label="Body Text Fonts">
                      {BODY_FONTS.map((font) => (
                        <option key={font.id} value={font.id} style={{ fontFamily: font.fallback }}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="System Fonts">
                      {SYSTEM_FONTS.map((font) => (
                        <option key={font.id} value={font.id}>
                          {font.displayName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Action Buttons - Full Width */}
              <div className="md:col-span-2 flex gap-2 justify-end pt-4">
                <button onClick={handleCancel} className="btn btn-ghost" disabled={isPending}>
                  Cancel
                </button>
                <button onClick={handleSave} className="btn btn-primary" disabled={isPending}>
                  {isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Book Information</h3>

                <div>
                  <div className="label">
                    <span className="label-text font-semibold">Title</span>
                  </div>
                  <div className="px-3 py-2">
                    {book.title}
                  </div>
                </div>

                <div>
                  <div className="label">
                    <span className="label-text font-semibold">Description</span>
                  </div>
                  <div className="px-3 py-2 min-h-[8rem]">
                    {book.description || <em className="opacity-60">No description</em>}
                  </div>
                </div>
              </div>

              {/* Right Column - Font Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Font Configuration</h3>

                <div>
                  <div className="label">
                    <span className="label-text font-semibold">Chapter Titles Font</span>
                  </div>
                  <div className="px-3 py-2">
                    {getFontById((styleConfig as { h1Font?: string }).h1Font)?.displayName || 'Serif (System)'}
                  </div>
                </div>

                <div>
                  <div className="label">
                    <span className="label-text font-semibold">Section Headings Font</span>
                  </div>
                  <div className="px-3 py-2">
                    {getFontById((styleConfig as { h2Font?: string }).h2Font)?.displayName || 'Serif (System)'}
                  </div>
                </div>

                <div>
                  <div className="label">
                    <span className="label-text font-semibold">Subsection Headings Font</span>
                  </div>
                  <div className="px-3 py-2">
                    {getFontById((styleConfig as { h3Font?: string }).h3Font)?.displayName || 'Serif (System)'}
                  </div>
                </div>

                <div>
                  <div className="label">
                    <span className="label-text font-semibold">Paragraph Text Font</span>
                  </div>
                  <div className="px-3 py-2">
                    {getFontById((styleConfig as { bodyFont?: string }).bodyFont)?.displayName || 'Sans Serif (System)'}
                  </div>
                </div>

                <div>
                  <div className="label">
                    <span className="label-text font-semibold">Blockquote Font</span>
                  </div>
                  <div className="px-3 py-2">
                    {getFontById((styleConfig as { blockquoteFont?: string }).blockquoteFont)?.displayName || 'Serif (System)'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
