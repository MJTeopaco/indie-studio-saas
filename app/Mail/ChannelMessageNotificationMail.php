<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ChannelMessageNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $messageData
     * @param  array<int, array<string, mixed>>  $attachmentsData
     */
    public function __construct(
        public string $senderName,
        public string $channelTitle,
        public string $bodyText,
        public string $studioName,
        public string $inboxUrl,
        public array $attachmentsData = []
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[{$this->studioName}] New message from {$this->senderName} in {$this->channelTitle}",
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    private function buildHtml(): string
    {
        $safeSender = htmlspecialchars($this->senderName, ENT_QUOTES, 'UTF-8');
        $safeChannel = htmlspecialchars($this->channelTitle, ENT_QUOTES, 'UTF-8');
        $safeStudio = htmlspecialchars($this->studioName, ENT_QUOTES, 'UTF-8');
        $safeBody = nl2br(htmlspecialchars($this->bodyText, ENT_QUOTES, 'UTF-8'));
        $safeUrl = htmlspecialchars($this->inboxUrl, ENT_QUOTES, 'UTF-8');

        $attachmentsHtml = '';
        if (! empty($this->attachmentsData)) {
            $attachmentsHtml .= '<div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e2e8f0;">';
            $attachmentsHtml .= '<strong style="font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Attachments:</strong><ul style="margin: 8px 0 0 0; padding-left: 18px; font-size: 13px; color: #334155;">';
            foreach ($this->attachmentsData as $att) {
                $name = htmlspecialchars($att['name'] ?? 'File', ENT_QUOTES, 'UTF-8');
                $url = htmlspecialchars($att['url'] ?? '#', ENT_QUOTES, 'UTF-8');
                $size = isset($att['size']) ? ' ('.round($att['size'] / 1024).' KB)' : '';
                $attachmentsHtml .= "<li><a href=\"{$url}\" style=\"color: #6366f1; text-decoration: underline;\">{$name}</a>{$size}</li>";
            }
            $attachmentsHtml .= '</ul></div>';
        }

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SprintStudio Notification</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <tr>
            <td style="padding: 24px 32px; background: linear-gradient(135deg, #0f172a, #1e293b); color: #ffffff;">
                <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #818cf8; background: rgba(99,102,241,0.18); padding: 4px 10px; border-radius: 20px;">SprintStudio</span>
                <h1 style="margin: 12px 0 4px 0; font-size: 20px; font-weight: 700; color: #ffffff;">New Message in {$safeChannel}</h1>
                <p style="margin: 0; font-size: 13px; color: #94a3b8;">Workspace: {$safeStudio}</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 32px;">
                <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a;">{$safeSender}</div>
                    <span style="margin-left: 8px; font-size: 12px; color: #64748b;">sent a message:</span>
                </div>
                <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px 20px; font-size: 14px; line-height: 1.6; color: #334155; border-left: 4px solid #6366f1;">
                    {$safeBody}
                </div>
                {$attachmentsHtml}
                <div style="margin-top: 28px; text-align: center;">
                    <a href="{$safeUrl}" style="display: inline-block; padding: 12px 24px; font-size: 13px; font-weight: 700; color: #ffffff; background: linear-gradient(135deg, #4f46e5, #6366f1); border-radius: 10px; text-decoration: none; box-shadow: 0 2px 4px rgba(79,70,229,0.25);">
                        Open in SprintStudio
                    </a>
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
                You received this email because you are a member of {$safeStudio} on SprintStudio.
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }
}
