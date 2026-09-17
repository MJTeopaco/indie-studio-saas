<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class ReportSharedMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $reportData
     */
    public function __construct(
        public string $senderName,
        public string $reportTitle,
        public string $scopeType,
        public string $studioName,
        public string $reportUrl,
        public ?string $personalNote = null,
        public array $reportData = [],
        public ?string $pdfContent = null,
        public ?string $csvContent = null,
        public ?string $pdfFilename = null,
        public ?string $csvFilename = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->studioName}] {$this->senderName} shared a report: {$this->reportTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        $cleanTitle = Str::slug($this->reportTitle) ?: 'report';
        $dateStr = now()->format('Y-m-d');

        if (! empty($this->pdfContent)) {
            $attachments[] = Attachment::fromData(
                fn () => $this->pdfContent,
                $this->pdfFilename ?: "{$cleanTitle}-{$dateStr}.pdf"
            )->withMime('application/pdf');
        }

        if (! empty($this->csvContent)) {
            $attachments[] = Attachment::fromData(
                fn () => $this->csvContent,
                $this->csvFilename ?: "{$cleanTitle}-{$dateStr}.csv"
            )->withMime('text/csv');
        }

        return $attachments;
    }

    private function buildHtml(): string
    {
        $safeSender = htmlspecialchars($this->senderName, ENT_QUOTES, 'UTF-8');
        $safeTitle = htmlspecialchars($this->reportTitle, ENT_QUOTES, 'UTF-8');
        $safeStudio = htmlspecialchars($this->studioName, ENT_QUOTES, 'UTF-8');
        $safeScope = htmlspecialchars(ucfirst($this->scopeType), ENT_QUOTES, 'UTF-8');
        $safeNote = $this->personalNote ? nl2br(htmlspecialchars($this->personalNote, ENT_QUOTES, 'UTF-8')) : null;

        $cleanTitle = Str::slug($this->reportTitle) ?: 'report';
        $dateStr = now()->format('Y-m-d');
        $pdfName = htmlspecialchars($this->pdfFilename ?: "{$cleanTitle}-{$dateStr}.pdf", ENT_QUOTES, 'UTF-8');
        $csvName = htmlspecialchars($this->csvFilename ?: "{$cleanTitle}-{$dateStr}.csv", ENT_QUOTES, 'UTF-8');

        $noteSection = '';
        if ($safeNote) {
            $noteSection = <<<HTML
            <div style="margin-bottom: 20px; padding: 14px 18px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px; font-size: 13px; color: #334155; line-height: 1.5;">
                <strong style="color: #0f172a; display: block; margin-bottom: 4px;">Note from {$safeSender}:</strong>
                {$safeNote}
            </div>
HTML;
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{$safeTitle}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Header -->
        <tr>
            <td style="padding: 24px 28px; background: linear-gradient(135deg, #0f172a, #1e1b4b); color: #ffffff;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #a5b4fc; margin-bottom: 6px;">
                    {$safeStudio}  •  {$safeScope} Report
                </div>
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">
                    {$safeTitle}
                </h1>
            </td>
        </tr>

        <!-- Body -->
        <tr>
            <td style="padding: 28px;">
                <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                    Hello,<br>
                    <strong>{$safeSender}</strong> has sent you the performance report for <strong>{$safeTitle}</strong>.
                </p>

                {$noteSection}

                <!-- Attachment Files Card -->
                <div style="padding: 16px 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px;">
                        Attached Files (2)
                    </div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #0f172a;">
                                📄 <strong>{$pdfName}</strong>
                                <span style="font-size: 11px; color: #64748b; margin-left: 6px;">(PDF Document)</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 6px 0; font-size: 13px; color: #0f172a;">
                                📊 <strong>{$csvName}</strong>
                                <span style="font-size: 11px; color: #64748b; margin-left: 6px;">(CSV Audit Spreadsheet)</span>
                            </td>
                        </tr>
                    </table>
                </div>

                <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                    Both files are attached directly to this email for viewing and download.
                </p>
            </td>
        </tr>

        <!-- Footer -->
        <tr>
            <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
                SprintStudio SaaS  •  {$safeStudio}
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}

