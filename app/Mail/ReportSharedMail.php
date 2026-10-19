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
        public ?string $reportUrl = null,
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
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $attachments = [];

        $reportTypeSlug = Str::studly(str_replace(['_', '-'], ' ', $this->reportData['type'] ?? 'report'));
        $studioSlug = Str::studly($this->studioName);
        $dateSlug = now()->format('Y-m-d');

        if (! empty($this->pdfContent)) {
            $attachments[] = Attachment::fromData(
                fn () => $this->pdfContent,
                $this->pdfFilename ?: "StudioSprint_{$reportTypeSlug}_{$studioSlug}_{$dateSlug}.pdf"
            )->withMime('application/pdf');
        }

        return $attachments;
    }

    private function buildHtml(): string
    {
        $safeSender = htmlspecialchars($this->senderName, ENT_QUOTES, 'UTF-8');
        $safeTitle = htmlspecialchars($this->reportTitle, ENT_QUOTES, 'UTF-8');
        $safeStudio = htmlspecialchars($this->studioName, ENT_QUOTES, 'UTF-8');
        $safeScope = htmlspecialchars(ucwords(str_replace('_', ' ', $this->scopeType)), ENT_QUOTES, 'UTF-8');
        $safeNote = $this->personalNote
            ? nl2br(htmlspecialchars($this->personalNote, ENT_QUOTES, 'UTF-8'))
            : null;

        $reportTypeSlug = Str::studly(str_replace(['_', '-'], ' ', $this->reportData['type'] ?? 'report'));
        $studioSlug = Str::studly($this->studioName);
        $dateSlug = now()->format('Y-m-d');
        $pdfName = htmlspecialchars(
            $this->pdfFilename ?: "StudioSprint_{$reportTypeSlug}_{$studioSlug}_{$dateSlug}.pdf",
            ENT_QUOTES,
            'UTF-8'
        );

        $completionRate = (int) ($this->reportData['completion_rate'] ?? 0);
        $totalTasks = (int) ($this->reportData['total_tasks'] ?? 0);
        $completedTasks = (int) ($this->reportData['completed_tasks'] ?? 0);
        $period = htmlspecialchars($this->reportData['reporting_period'] ?? 'All records', ENT_QUOTES, 'UTF-8');

        $noteSection = '';
        if ($safeNote) {
            $noteSection = <<<HTML
            <div style="margin: 20px 0; padding: 14px 16px; background-color: #F8FAFC; border-left: 3px solid #007CFF; border-radius: 0 4px 4px 0;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Note from {$safeSender}</p>
              <p style="margin: 0; font-size: 13.5px; line-height: 1.55; color: #1E293B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">{$safeNote}</p>
            </div>
HTML;
        }

        $summaryTable = '';
        if ($totalTasks > 0) {
            $summaryTable = <<<HTML
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; border: 1px solid #E2E8F0; border-radius: 6px; border-collapse: separate; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px;">
              <tr>
                <td style="padding: 10px 16px; background-color: #F8FAFC; color: #64748B; font-weight: 500; width: 35%; border-bottom: 1px solid #E2E8F0;">Scope</td>
                <td style="padding: 10px 16px; color: #0F172A; font-weight: 600; border-bottom: 1px solid #E2E8F0;">{$safeScope}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; background-color: #F8FAFC; color: #64748B; font-weight: 500; border-bottom: 1px solid #E2E8F0;">Reporting Period</td>
                <td style="padding: 10px 16px; color: #0F172A; border-bottom: 1px solid #E2E8F0;">{$period}</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; background-color: #F8FAFC; color: #64748B; font-weight: 500; border-bottom: 1px solid #E2E8F0;">Task Completion</td>
                <td style="padding: 10px 16px; color: #0F172A; font-weight: 600; border-bottom: 1px solid #E2E8F0;">{$completionRate}% &mdash; {$completedTasks} of {$totalTasks} tasks completed</td>
              </tr>
              <tr>
                <td style="padding: 10px 16px; background-color: #F8FAFC; color: #64748B; font-weight: 500;">Attached File</td>
                <td style="padding: 10px 16px; color: #0F172A; font-weight: 500;">{$pdfName}</td>
              </tr>
            </table>
HTML;
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{$safeTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F7; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F4F5F7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="padding: 36px 40px 32px;">
              <!-- Header / Brand -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <span style="font-size: 15px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">StudioSprint</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #94A3B8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">{$safeStudio}</span>
                  </td>
                </tr>
              </table>

              <!-- Report Title & Intro -->
              <h1 style="margin: 0 0 12px; font-size: 20px; font-weight: 600; color: #0F172A; line-height: 1.35; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                {$safeTitle}
              </h1>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <strong>{$safeSender}</strong> has shared a report with you. The complete document is attached to this email as a PDF.
              </p>

              {$noteSection}

              {$summaryTable}

              <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.5; color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                You can review or download the report directly from the attached file.
              </p>

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #E2E8F0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-size: 12px; color: #64748B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      StudioSprint &bull; {$safeStudio}
                    </p>
                    <p style="margin: 0; font-size: 11px; color: #94A3B8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                      This notification was sent on behalf of {$safeSender}.
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
