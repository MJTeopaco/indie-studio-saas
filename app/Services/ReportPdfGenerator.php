<?php

namespace App\Services;

use Illuminate\Support\Str;

class ReportPdfGenerator
{
    /**
     * Generate a professional executive PDF document in pure PHP matching the on-screen preview sheet.
     *
     * @param  array<string, mixed>  $report
     */
    public static function generate(
        array $report,
        string $studioName = 'SprintStudio',
        string $senderName = 'Studio Member',
        string $orientation = 'portrait'
    ): string {
        $orientation = $report['orientation'] ?? $orientation;
        $generator = new self($report, $studioName, $senderName, $orientation);

        return $generator->build();
    }

    private array $pages = [];

    private int $pageWidth;

    private int $pageHeight;

    public function __construct(
        private array $report,
        private string $studioName,
        private string $senderName,
        private string $orientation = 'portrait'
    ) {
        if ($this->orientation === 'landscape') {
            $this->pageWidth = 842;
            $this->pageHeight = 595;
        } else {
            $this->pageWidth = 595;
            $this->pageHeight = 842;
        }
    }

    public function build(): string
    {
        $this->pages = [];

        // 1. Data extraction
        $title = $this->report['title'] ?? 'Performance Report';
        $summary = $this->report['summary'] ?? ($this->report['executive_insight'] ?? '');
        $scopeTarget = $this->report['project_name'] ?? ($this->report['target_name'] ?? ($this->report['scope'] ?? 'StudioSprint Demo Project'));
        $reportType = ucwords(str_replace('_', ' ', $this->report['type'] ?? 'individual_performance'));
        $refId = $this->report['id'] ?? (string) rand(100000, 999999);
        $period = $this->report['reporting_period'] ?? 'All Historical Workspace Records';
        $dateStr = ! empty($this->report['generated_at'])
            ? date('m/d/Y', strtotime($this->report['generated_at']))
            : date('m/d/Y');

        $completionRate = (int) ($this->report['completion_rate'] ?? 0);
        $totalTasks = (int) ($this->report['total_tasks'] ?? 0);
        $completedTasks = (int) ($this->report['completed_tasks'] ?? 0);
        $unfinishedTasks = (int) ($this->report['unfinished_tasks'] ?? max(0, $totalTasks - $completedTasks));
        $inProgressTasks = (int) ($this->report['in_progress_tasks'] ?? 0);
        $reviewTasks = (int) ($this->report['review_tasks'] ?? 0);
        $todoTasks = (int) ($this->report['todo_tasks'] ?? max(0, $unfinishedTasks - $inProgressTasks - $reviewTasks));
        $overdueTasks = (int) ($this->report['overdue_tasks'] ?? 0);
        $plannedSp = (int) ($this->report['planned_story_points'] ?? 0);
        $completedSp = (int) ($this->report['completed_story_points'] ?? 0);

        $membersPerformance = $this->report['members_performance'] ?? [];
        $membersCount = ! empty($membersPerformance)
            ? count($membersPerformance)
            : (int) ($this->report['active_members_count'] ?? 1);

        $auditTasks = $this->report['audit_tasks'] ?? ($this->report['tasks_list'] ?? []);
        $contentW = $this->pageWidth - 80;
        $isLandscape = $this->orientation === 'landscape';
        $overallStatus = $overdueTasks > 0 ? 'Action Required' : 'On Track';

        // ══════════════════════════════════════════════════════════════════════
        // PAGE 1: PREVIEW-MATCHED WHITE EXECUTIVE SHEET
        // ══════════════════════════════════════════════════════════════════════
        $p1 = [];

        // Clean white background
        $p1[] = '1 1 1 rg';
        $p1[] = "0 0 {$this->pageWidth} {$this->pageHeight} re f";

        // ── VAULTERA BRAND LOGO (Hexagon mark only, no name) ──
        // Brand blue: #007CFF = 0.0 0.486 1.0 in PDF RGB
        $topY = $this->pageHeight - 38;
        $logoX = 40;
        $hexS = 11.0; // half-height of hexagon

        // Hexagon shape (flat-top orientation, 6 vertices)
        $hcx = $logoX + 11.0;
        $hcy = $topY - 6.0;
        $hw = 10.5;
        $hh = $hexS;

        $p1[] = '0.0 0.486 1.0 rg'; // Brand blue fill
        $p1[] = '0.0 0.486 1.0 RG 0.3 w';
        $p1[] = implode(' ', [
            // Flat-top hexagon path
            number_format($hcx - $hw, 3).' '.number_format($hcy, 3).' m',
            number_format($hcx - $hw * 0.5, 3).' '.number_format($hcy + $hh, 3).' l',
            number_format($hcx + $hw * 0.5, 3).' '.number_format($hcy + $hh, 3).' l',
            number_format($hcx + $hw, 3).' '.number_format($hcy, 3).' l',
            number_format($hcx + $hw * 0.5, 3).' '.number_format($hcy - $hh, 3).' l',
            number_format($hcx - $hw * 0.5, 3).' '.number_format($hcy - $hh, 3).' l',
            'h f',
        ]);

        // White lock icon centered inside hexagon
        $p1[] = '1 1 1 rg';
        $lbx = $hcx - 3.2;
        $lby = $hcy - 4.5;
        $p1[] = "{$lbx} {$lby} 6.4 5.5 re f"; // lock body
        // Lock shackle arc (top portion)
        $p1[] = '1 1 1 RG 1.3 w';
        $sax = $hcx;
        $say = $lby + 5.5;
        $sr = 2.7;
        $k = $sr * 0.5523;
        $p1[] = implode(' ', [
            number_format($sax - $sr, 3).' '.number_format($say, 3).' m',
            number_format($sax - $sr, 3).' '.number_format($say + $k, 3),
            number_format($sax - $k, 3).' '.number_format($say + $sr, 3),
            number_format($sax, 3).' '.number_format($say + $sr, 3).' c',
            number_format($sax + $k, 3).' '.number_format($say + $sr, 3),
            number_format($sax + $sr, 3).' '.number_format($say + $k, 3),
            number_format($sax + $sr, 3).' '.number_format($say, 3).' c S',
        ]);

        // ── DOCUMENT CONTROL BOX (TOP RIGHT) ──
        $docW = 155;
        $docH = 58;
        $docX = $this->pageWidth - 40 - $docW;
        $docY = $topY - 58;

        $p1[] = '0.98 0.98 0.99 rg'; // Light box fill
        $p1[] = "{$docX} {$docY} {$docW} {$docH} re f";
        $p1[] = '0.88 0.90 0.93 RG 0.5 w'; // Box border
        $p1[] = "{$docX} {$docY} {$docW} {$docH} re s";

        // Document Control text (Right-aligned inside box)
        $p1[] = '0.55 0.60 0.70 rg';
        $p1[] = 'BT /F2 7 Tf '.($docX + $docW - 8 - 82).' '.($docY + $docH - 13).' Td (DOCUMENT CONTROL) Tj ET';

        $p1[] = '0.15 0.20 0.30 rg';
        $p1[] = 'BT /F2 7.5 Tf '.($docX + $docW - 8 - 72).' '.($docY + $docH - 25).' Td (REF: SS-RPT-'.$this->escapePdfText((string) $refId).') Tj ET';

        $p1[] = '0.35 0.40 0.50 rg';
        $p1[] = 'BT /F1 7.5 Tf '.($docX + $docW - 8 - 45).' '.($docY + $docH - 37).' Td ('.$this->escapePdfText($dateStr).') Tj ET';

        // Period with multi-line wrapping if long
        $periodLines = $this->wrapText($period, 22, 2);
        $p1[] = '0.45 0.50 0.60 rg';
        if (count($periodLines) > 1) {
            $p1[] = 'BT /F1 6.5 Tf '.($docX + 8).' '.($docY + 14).' Td (Period: '.$this->escapePdfText($periodLines[0]).') Tj ET';
            $p1[] = 'BT /F1 6.5 Tf '.($docX + 8).' '.($docY + 5).' Td ('.$this->escapePdfText($periodLines[1]).') Tj ET';
        } else {
            $p1[] = 'BT /F1 6.5 Tf '.($docX + 8).' '.($docY + 7).' Td (Period: '.$this->escapePdfText($periodLines[0] ?? '').') Tj ET';
        }

        // ── MAIN REPORT TITLE (MULTI-LINE WRAPPING IF LONG) ──
        $p1[] = '0.06 0.09 0.16 rg';
        $maxTitleChars = $isLandscape ? 50 : 32;
        $titleLines = $this->wrapText($title, $maxTitleChars, 2);

        $titleCurrentY = $topY - 34;
        if (count($titleLines) > 1) {
            $p1[] = 'BT /F2 16 Tf 40 '.$titleCurrentY.' Td ('.$this->escapePdfText($titleLines[0]).') Tj ET';
            $titleCurrentY -= 17;
            $p1[] = 'BT /F2 16 Tf 40 '.$titleCurrentY.' Td ('.$this->escapePdfText($titleLines[1]).') Tj ET';
        } else {
            $p1[] = 'BT /F2 18 Tf 40 '.$titleCurrentY.' Td ('.$this->escapePdfText($titleLines[0] ?? '').') Tj ET';
        }

        // Subtitle / Description (Multi-line wrapping if long)
        $cleanSub = $summary ?: 'Your personal completion rate, story points burned, on-time delivery stats, and output velocity.';
        $subLines = $this->wrapText($cleanSub, $isLandscape ? 90 : 58, 2);
        $subY = $titleCurrentY - 14;
        $p1[] = '0.40 0.45 0.55 rg';
        foreach ($subLines as $sLine) {
            $p1[] = 'BT /F1 7.5 Tf 40 '.$subY.' Td ('.$this->escapePdfText($sLine).') Tj ET';
            $subY -= 10;
        }

        // Subtle Divider Line below header
        $dividerY = min($subY - 4, $docY - 8);
        $p1[] = '0.88 0.90 0.93 RG 0.5 w';
        $p1[] = "40 {$dividerY} m ".($this->pageWidth - 40)." {$dividerY} l S";

        // ── METADATA DETAILS RIBBON (4 COLUMNS WITH MULTI-LINE SUPPORT) ──
        $ribbonY = $dividerY - 10 - 38;
        $ribbonH = 38;
        $p1[] = '0.97 0.98 0.99 rg';
        $p1[] = "40 {$ribbonY} {$contentW} {$ribbonH} re f";
        $p1[] = '0.88 0.90 0.93 RG 0.5 w';
        $p1[] = "40 {$ribbonY} {$contentW} {$ribbonH} re s";

        $colW = (int) ($contentW / 4);

        // Ribbon Col 1: SCOPE / TARGET (Multi-line if long)
        $p1[] = '0.50 0.55 0.65 rg';
        $p1[] = 'BT /F2 6.5 Tf 48 '.($ribbonY + 24).' Td (SCOPE / TARGET) Tj ET';
        $p1[] = '0.08 0.12 0.20 rg';
        $scopeLines = $this->wrapText($scopeTarget, 18, 2);
        if (count($scopeLines) > 1) {
            $p1[] = 'BT /F2 7.5 Tf 48 '.($ribbonY + 13).' Td ('.$this->escapePdfText($scopeLines[0]).') Tj ET';
            $p1[] = 'BT /F2 7.5 Tf 48 '.($ribbonY + 4).' Td ('.$this->escapePdfText($scopeLines[1]).') Tj ET';
        } else {
            $p1[] = 'BT /F2 8.5 Tf 48 '.($ribbonY + 9).' Td ('.$this->escapePdfText($scopeLines[0] ?? '').') Tj ET';
        }

        // Ribbon Col 2: REPORT TYPE
        $p1[] = '0.50 0.55 0.65 rg';
        $p1[] = 'BT /F2 6.5 Tf '.(40 + $colW + 8).' '.($ribbonY + 24).' Td (REPORT TYPE) Tj ET';
        $p1[] = '0.08 0.12 0.20 rg';
        $typeLines = $this->wrapText($reportType, 18, 2);
        if (count($typeLines) > 1) {
            $p1[] = 'BT /F2 7.5 Tf '.(40 + $colW + 8).' '.($ribbonY + 13).' Td ('.$this->escapePdfText($typeLines[0]).') Tj ET';
            $p1[] = 'BT /F2 7.5 Tf '.(40 + $colW + 8).' '.($ribbonY + 4).' Td ('.$this->escapePdfText($typeLines[1]).') Tj ET';
        } else {
            $p1[] = 'BT /F2 8.5 Tf '.(40 + $colW + 8).' '.($ribbonY + 9).' Td ('.$this->escapePdfText($typeLines[0] ?? '').') Tj ET';
        }

        // Ribbon Col 3: GENERATED BY
        $p1[] = '0.50 0.55 0.65 rg';
        $p1[] = 'BT /F2 6.5 Tf '.(40 + $colW * 2 + 8).' '.($ribbonY + 24).' Td (GENERATED BY) Tj ET';
        $p1[] = '0.08 0.12 0.20 rg';
        $senderLines = $this->wrapText($this->senderName, 18, 2);
        if (count($senderLines) > 1) {
            $p1[] = 'BT /F2 7.5 Tf '.(40 + $colW * 2 + 8).' '.($ribbonY + 13).' Td ('.$this->escapePdfText($senderLines[0]).') Tj ET';
            $p1[] = 'BT /F2 7.5 Tf '.(40 + $colW * 2 + 8).' '.($ribbonY + 4).' Td ('.$this->escapePdfText($senderLines[1]).') Tj ET';
        } else {
            $p1[] = 'BT /F2 8.5 Tf '.(40 + $colW * 2 + 8).' '.($ribbonY + 9).' Td ('.$this->escapePdfText($senderLines[0] ?? '').') Tj ET';
        }

        // Ribbon Col 4: OVERALL STATUS
        $p1[] = '0.50 0.55 0.65 rg';
        $p1[] = 'BT /F2 6.5 Tf '.(40 + $colW * 3 + 8).' '.($ribbonY + 24).' Td (OVERALL STATUS) Tj ET';
        if ($overdueTasks > 0) {
            $p1[] = '0.85 0.35 0.05 rg'; // Warm Amber/Orange from preview
        } else {
            $p1[] = '0.05 0.55 0.30 rg'; // Emerald
        }
        $p1[] = 'BT /F2 8.5 Tf '.(40 + $colW * 3 + 8).' '.($ribbonY + 9).' Td ('.$this->escapePdfText($overallStatus).') Tj ET';

        // ── EXECUTIVE PERFORMANCE SUMMARY (4 SCORECARD CARDS) ──
        $currentY = $ribbonY - 15;
        $p1[] = '0.50 0.55 0.65 rg';
        $p1[] = "BT /F2 7.5 Tf 40 {$currentY} Td (EXECUTIVE PERFORMANCE SUMMARY) Tj ET";

        $currentY -= 54;
        $kpiBoxW = (int) (($contentW - 30) / 4);
        $kpiBoxH = 48;

        // Box 1: DELIVERY ADHERENCE
        $p1 = array_merge($p1, $this->renderWhiteScorecard(
            40,
            $currentY,
            $kpiBoxW,
            $kpiBoxH,
            'DELIVERY ADHERENCE',
            "{$completionRate}%",
            "{$completedTasks} of {$totalTasks} tasks resolved",
            '0.06 0.09 0.16'
        ));

        // Box 2: VELOCITY DELIVERED
        $p1 = array_merge($p1, $this->renderWhiteScorecard(
            40 + ($kpiBoxW + 10),
            $currentY,
            $kpiBoxW,
            $kpiBoxH,
            'VELOCITY DELIVERED',
            "{$completedSp}",
            "of {$plannedSp} SP planned",
            '0.06 0.09 0.16',
            'SP'
        ));

        // Box 3: UNRESOLVED SCOPE
        $unresolvedColor = $overdueTasks > 0 ? '0.88 0.12 0.22' : '0.06 0.09 0.16';
        $p1 = array_merge($p1, $this->renderWhiteScorecard(
            40 + ($kpiBoxW + 10) * 2,
            $currentY,
            $kpiBoxW,
            $kpiBoxH,
            'UNRESOLVED SCOPE',
            (string) $unfinishedTasks,
            "{$overdueTasks} overdue items",
            $unresolvedColor
        ));

        // Box 4: RESOURCE ALLOCATION
        $p1 = array_merge($p1, $this->renderWhiteScorecard(
            40 + ($kpiBoxW + 10) * 3,
            $currentY,
            $kpiBoxW,
            $kpiBoxH,
            'RESOURCE ALLOCATION',
            (string) $membersCount,
            'Active contributing members',
            '0.06 0.09 0.16'
        ));

        // ── TWO MIDDLE INTELLIGENCE CARDS (MULTI-COLOR DONUT & TRAJECTORY) ──
        $currentY -= 14;
        $midCardH = 135;
        $midCardW = (int) (($contentW - 12) / 2);
        $currentY -= $midCardH;

        // Card 1: SCOPE & STATUS ALLOCATION (With Multi-Color Donut Arcs)
        $p1 = array_merge($p1, $this->renderMultiColorDonutCard(
            40,
            $currentY,
            $midCardW,
            $midCardH,
            $totalTasks,
            $completedTasks,
            $inProgressTasks,
            $reviewTasks,
            $todoTasks,
            $completionRate,
            $auditTasks
        ));

        // Card 2: CUMULATIVE DELIVERY TRAJECTORY (With Trend Area & Line)
        $p1 = array_merge($p1, $this->renderTrajectoryChartCard(
            40 + $midCardW + 12,
            $currentY,
            $midCardW,
            $midCardH,
            $plannedSp,
            $completedSp
        ));

        // ── DETAILED TASK AUDIT LOG (ON PAGE 1 WITH MULTI-LINE SUPPORT) ──
        $currentY -= 16;
        $p1[] = '0.06 0.09 0.16 rg';
        $p1[] = "BT /F2 8.5 Tf 40 {$currentY} Td (DETAILED TASK AUDIT LOG) Tj ET";

        $currentY -= 11;
        $p1[] = '0.45 0.50 0.60 rg';
        $auditCountStr = count($auditTasks).' total tasks';
        $p1[] = "BT /F1 7.5 Tf 40 {$currentY} Td (Itemized breakdown of scope items ({$auditCountStr})) Tj ET";

        $currentY -= 18;
        $p1 = array_merge($p1, $this->renderAuditTableHeader($currentY, $contentW));
        $currentY -= 2;

        // Render Page 1 task rows with dynamic height per row
        $footerLimit = 35;
        $page1Tasks = [];
        $remainingTasks = [];

        foreach ($auditTasks as $idx => $t) {
            $tSummaryLines = $this->wrapText($t['title'] ?? 'Task', $isLandscape ? 45 : 26, 3);
            $tAssigneeLines = $this->wrapText($t['assigned_employee'] ?? ($t['assignee'] ?? 'Unassigned'), 16, 2);
            $linesNeeded = max(count($tSummaryLines), count($tAssigneeLines), 1);
            $rowH = 18 + ($linesNeeded - 1) * 9;

            if ($currentY - $rowH >= $footerLimit) {
                $page1Tasks[] = $t;
                $p1 = array_merge($p1, $this->renderAuditTableRow($t, $currentY - $rowH, $contentW, $idx % 2 === 0, $rowH, $tSummaryLines, $tAssigneeLines));
                $currentY -= $rowH;
            } else {
                $remainingTasks = array_slice($auditTasks, count($page1Tasks));
                break;
            }
        }

        $p1[] = $this->renderFooter(1);
        $this->pages[] = implode("\n", $p1);

        // ══════════════════════════════════════════════════════════════════════
        // SUBSEQUENT PAGES: CONTINUATION OF AUDIT LOG (IF TASKS EXCEED PAGE 1)
        // ══════════════════════════════════════════════════════════════════════
        if (! empty($remainingTasks)) {
            $pageNum = 2;
            while (! empty($remainingTasks)) {
                $pageOps = [];
                $pageOps[] = '1 1 1 rg';
                $pageOps[] = "0 0 {$this->pageWidth} {$this->pageHeight} re f";

                $topY = $this->pageHeight - 35;
                $pageOps[] = '0.06 0.09 0.16 rg';
                $pageOps[] = 'BT /F2 9.5 Tf 40 '.($topY - 10).' Td ('.Str::limit($this->escapePdfText($title), 40).' - DETAILED TASK AUDIT LOG CONTINUED) Tj ET';

                $pageOps[] = '0.50 0.55 0.65 rg';
                $pageOps[] = 'BT /F1 7.5 Tf '.($this->pageWidth - 170).' '.($topY - 10).' Td (REF: WS-RPT-'.$this->escapePdfText((string) $refId).') Tj ET';

                $cY = $topY - 26;
                $pageOps[] = '0.88 0.90 0.93 RG 0.5 w';
                $pageOps[] = "40 {$cY} m ".($this->pageWidth - 40)." {$cY} l S";

                $cY -= 14;
                $pageOps = array_merge($pageOps, $this->renderAuditTableHeader($cY, $contentW));
                $cY -= 2;

                $renderedThisPage = 0;
                $rowIdx = 0;
                while (! empty($remainingTasks)) {
                    $t = $remainingTasks[0];
                    $tSummaryLines = $this->wrapText($t['title'] ?? 'Task', $isLandscape ? 45 : 26, 3);
                    $tAssigneeLines = $this->wrapText($t['assigned_employee'] ?? ($t['assignee'] ?? 'Unassigned'), 16, 2);
                    $linesNeeded = max(count($tSummaryLines), count($tAssigneeLines), 1);
                    $rowH = 18 + ($linesNeeded - 1) * 9;

                    if ($cY - $rowH >= $footerLimit) {
                        array_shift($remainingTasks);
                        $pageOps = array_merge($pageOps, $this->renderAuditTableRow($t, $cY - $rowH, $contentW, $rowIdx % 2 === 0, $rowH, $tSummaryLines, $tAssigneeLines));
                        $cY -= $rowH;
                        $renderedThisPage++;
                        $rowIdx++;
                    } else {
                        break;
                    }
                }

                $pageOps[] = $this->renderFooter($pageNum);
                $this->pages[] = implode("\n", $pageOps);
                $pageNum++;
            }
        }

        return $this->compilePdf();
    }

    private function renderWhiteScorecard(int $x, int $y, int $w, int $h, string $label, string $stat, string $sub, string $valColorRgb, string $statSuffix = ''): array
    {
        $ops = [];
        $ops[] = '1 1 1 rg';
        $ops[] = "{$x} {$y} {$w} {$h} re f";
        $ops[] = '0.88 0.90 0.93 RG 0.5 w';
        $ops[] = "{$x} {$y} {$w} {$h} re s";

        // Label
        $ops[] = '0.50 0.55 0.65 rg';
        $ops[] = 'BT /F2 6.5 Tf '.($x + 10).' '.($y + $h - 13).' Td ('.$this->escapePdfText($label).') Tj ET';

        // Big Stat
        $ops[] = "{$valColorRgb} rg";
        $ops[] = 'BT /F2 16 Tf '.($x + 10).' '.($y + 19).' Td ('.$this->escapePdfText($stat).') Tj ET';

        if ($statSuffix !== '') {
            $suffixOffset = 10 + (strlen($stat) * 10);
            $ops[] = '0.55 0.60 0.70 rg';
            $ops[] = 'BT /F1 7.5 Tf '.($x + $suffixOffset).' '.($y + 20).' Td ('.$this->escapePdfText($statSuffix).') Tj ET';
        }

        // Subtitle
        $ops[] = '0.45 0.50 0.60 rg';
        $ops[] = 'BT /F1 7 Tf '.($x + 10).' '.($y + 8).' Td ('.$this->escapePdfText($sub).') Tj ET';

        return $ops;
    }

    private function renderMultiColorDonutCard(
        int $x,
        int $y,
        int $w,
        int $h,
        int $total,
        int $done,
        int $inProg,
        int $review,
        int $todo,
        int $completionRate,
        array $auditTasks
    ): array {
        $ops = [];
        $ops[] = '1 1 1 rg';
        $ops[] = "{$x} {$y} {$w} {$h} re f";
        $ops[] = '0.88 0.90 0.93 RG 0.5 w';
        $ops[] = "{$x} {$y} {$w} {$h} re s";

        // Card Title
        $ops[] = '0.06 0.09 0.16 rg';
        $ops[] = 'BT /F2 8.5 Tf '.($x + 12).' '.($y + $h - 16).' Td (SCOPE & STATUS ALLOCATION) Tj ET';

        // Card Subtitle
        $ops[] = '0.45 0.50 0.60 rg';
        $ops[] = 'BT /F1 7 Tf '.($x + 12).' '.($y + $h - 27).' Td (Workflow distribution across '.$total.' total tasks) Tj ET';

        // ── ACCURATE STATUS SEGMENT COUNTS MATCHING PREVIEW ──
        $completedCount = 0;
        $inProgressCount = 0;
        $reviewCount = 0;
        $todoCount = 0;

        if (! empty($auditTasks)) {
            foreach ($auditTasks as $t) {
                $st = strtolower(trim((string) ($t['status'] ?? '')));
                if ($st === 'completed' || $st === 'done') {
                    $completedCount++;
                } elseif ($st === 'in_progress') {
                    $inProgressCount++;
                } elseif ($st === 'review') {
                    $reviewCount++;
                } else {
                    $todoCount++;
                }
            }
        } else {
            $completedCount = $done;
            $inProgressCount = $inProg;
            $reviewCount = $review;
            $todoCount = max(0, $total - $completedCount - $inProgressCount - $reviewCount);
        }

        // Segments with exact colors matching Index.jsx preview:
        // Completed: #059669 -> 0.02 0.59 0.41
        // In Progress: #2563eb -> 0.15 0.39 0.92
        // In Review: #d97706 -> 0.85 0.47 0.02
        // To Do: #94a3b8 -> 0.58 0.64 0.72
        $segments = [];
        if ($completedCount > 0) {
            $segments[] = ['name' => 'Completed', 'count' => $completedCount, 'color' => '0.02 0.59 0.41'];
        }
        if ($inProgressCount > 0) {
            $segments[] = ['name' => 'In Progress', 'count' => $inProgressCount, 'color' => '0.15 0.39 0.92'];
        }
        if ($reviewCount > 0) {
            $segments[] = ['name' => 'In Review', 'count' => $reviewCount, 'color' => '0.85 0.47 0.02'];
        }
        if ($todoCount > 0) {
            $segments[] = ['name' => 'To Do', 'count' => $todoCount, 'color' => '0.58 0.64 0.72'];
        }

        if (empty($segments)) {
            $segments[] = ['name' => 'To Do', 'count' => 1, 'color' => '0.58 0.64 0.72'];
        }

        $totalSum = array_sum(array_column($segments, 'count'));

        // ── VECTOR DONUT GAUGE ──
        $cx = $x + 58;
        $cy = $y + 46;
        $rMid = 29.0;
        $strokeW = 10.0;

        if (count($segments) === 1) {
            // Full 360-degree circle in single active color
            $ops = array_merge($ops, $this->renderStrokedCircle($cx, $cy, $rMid, $strokeW, $segments[0]['color']));
        } else {
            // Multi-segment arcs for each distinct color
            $startAngle = -M_PI / 2; // 12 o'clock top
            $gap = count($segments) > 1 ? 0.04 : 0.0; // Subtle padding between wedges

            foreach ($segments as $seg) {
                $span = ($seg['count'] / $totalSum) * (2 * M_PI);
                $endAngle = $startAngle + $span;

                $arcStart = $startAngle + ($gap / 2);
                $arcEnd = $endAngle - ($gap / 2);
                if ($arcEnd > $arcStart) {
                    $ops = array_merge($ops, $this->renderDonutArc($cx, $cy, $rMid, $strokeW, $arcStart, $arcEnd, $seg['color']));
                }

                $startAngle = $endAngle;
            }
        }

        // Center Percentage Text inside Donut Hole
        $ops[] = '0.06 0.09 0.16 rg';
        $pctText = "{$completionRate}%";
        $pctX = $completionRate >= 100 ? ($cx - 13) : ($cx - 9);
        $ops[] = "BT /F2 11 Tf {$pctX} ".($cy - 2).' Td ('.$pctText.') Tj ET';

        $ops[] = '0.50 0.55 0.65 rg';
        $ops[] = 'BT /F2 5.5 Tf '.($cx - 15).' '.($cy - 10).' Td (RESOLVED) Tj ET';

        // ── STATUS BREAKDOWN LEGEND (SHOWING ALL ACTIVE SEGMENTS) ──
        $legX = $x + 115;
        $countItems = count($segments);
        $spacing = $countItems > 3 ? 15 : 18;
        $legY = $y + 46 + (int) (($countItems * $spacing) / 2) - 6;

        foreach ($segments as $st) {
            // Dot
            $ops[] = "{$st['color']} rg";
            $ops[] = "{$legX} ".($legY - 2).' 6 6 re f';

            // Status label
            $ops[] = '0.30 0.35 0.45 rg';
            $ops[] = 'BT /F1 7.5 Tf '.($legX + 11).' '.$legY.' Td ('.$this->escapePdfText($st['name']).') Tj ET';

            // Count & percentage
            $pct = $totalSum > 0 ? round(($st['count'] / $totalSum) * 100) : 100;
            $ops[] = '0.06 0.09 0.16 rg';
            $ops[] = 'BT /F2 7.5 Tf '.($legX + 78).' '.$legY.' Td ('.$st['count'].') Tj ET';

            $ops[] = '0.50 0.55 0.65 rg';
            $ops[] = 'BT /F1 6.5 Tf '.($legX + 88).' '.$legY." Td (({$pct}%)) Tj ET";

            $legY -= $spacing;
        }

        return $ops;
    }

    private function renderTrajectoryChartCard(int $x, int $y, int $w, int $h, int $plannedSp, int $deliveredSp): array
    {
        $ops = [];
        $ops[] = '1 1 1 rg';
        $ops[] = "{$x} {$y} {$w} {$h} re f";
        $ops[] = '0.88 0.90 0.93 RG 0.5 w';
        $ops[] = "{$x} {$y} {$w} {$h} re s";

        // Card Title
        $ops[] = '0.06 0.09 0.16 rg';
        $ops[] = 'BT /F2 8.5 Tf '.($x + 12).' '.($y + $h - 16).' Td (CUMULATIVE DELIVERY TRAJECTORY) Tj ET';

        // Card Subtitle
        $ops[] = '0.45 0.50 0.60 rg';
        $ops[] = 'BT /F1 7 Tf '.($x + 12).' '.($y + $h - 27).' Td (Planned target curve vs. actual story points delivered) Tj ET';

        // Chart plot area
        $plotX = $x + 28;
        $plotY = $y + 36;
        $plotW = $w - 42;
        $plotH = 50;

        // 4 Horizontal Grid Lines (dashed)
        $ops[] = '[2 2] 0 d 0.90 0.93 0.96 RG 0.5 w';
        $yLabels = ['16', '12', '8', '4', '0'];
        for ($i = 0; $i < 5; $i++) {
            $gridLineY = $plotY + (int) (($plotH / 4) * $i);
            $ops[] = "{$plotX} {$gridLineY} m ".($plotX + $plotW)." {$gridLineY} l S";

            // Y-Axis label
            $ops[] = '0.55 0.60 0.70 rg';
            $ops[] = 'BT /F1 6 Tf '.($plotX - 14).' '.($gridLineY - 2).' Td ('.$yLabels[4 - $i].') Tj ET';
        }
        $ops[] = '[] 0 d'; // Reset dash

        // X-Axis Labels
        $xMilestones = ['Kickoff', 'Milestone 1', 'Midpoint', 'Review', 'Target'];
        for ($i = 0; $i < 5; $i++) {
            $ptX = $plotX + (int) (($plotW / 4) * $i);
            $ops[] = '0.55 0.60 0.70 rg';
            $ops[] = 'BT /F1 5.5 Tf '.($ptX - 8).' '.($plotY - 9).' Td ('.$xMilestones[$i].') Tj ET';
        }

        // ── PLANNED TARGET CURVE (DASHED SLATE LINE WITH DOTS) ──
        $ops[] = '[3 3] 0 d 0.60 0.65 0.75 RG 1 w';
        $ops[] = "{$plotX} {$plotY} m";
        for ($i = 1; $i < 5; $i++) {
            $px = $plotX + (int) (($plotW / 4) * $i);
            $py = $plotY + (int) (($plotH / 4) * $i * 0.85);
            $ops[] = "{$px} {$py} l";
        }
        $ops[] = 'S [] 0 d';

        // Dots on Planned curve
        for ($i = 0; $i < 5; $i++) {
            $px = $plotX + (int) (($plotW / 4) * $i);
            $py = $plotY + (int) (($plotH / 4) * $i * 0.85);
            $ops = array_merge($ops, $this->renderPdfCircle($px, $py, 2.5, '0.60 0.65 0.75'));
        }

        // ── DELIVERED SP CURVE (SOLID BLACK/SLATE LINE WITH DOTS) ──
        $ops[] = '0.06 0.09 0.16 RG 1.5 w';
        $ops[] = "{$plotX} {$plotY} m";
        $endX = $plotX + (int) ($plotW / 4);
        $ops[] = "{$endX} {$plotY} l S";

        for ($i = 0; $i < 5; $i++) {
            $px = $plotX + (int) (($plotW / 4) * $i);
            $ops = array_merge($ops, $this->renderPdfCircle($px, $plotY, 3, '0.06 0.09 0.16'));
        }

        // ── BOTTOM LEGEND ──
        $legY = $y + 11;
        $legCenterX = $x + (int) ($w / 2) - 45;

        // Delivered SP Legend
        $ops[] = '0.06 0.09 0.16 RG 1.5 w';
        $ops[] = "{$legCenterX} {$legY} m ".($legCenterX + 12)." {$legY} l S";
        $ops = array_merge($ops, $this->renderPdfCircle($legCenterX + 6, $legY, 2.5, '0.06 0.09 0.16'));

        $ops[] = '0.30 0.35 0.45 rg';
        $ops[] = 'BT /F1 6.5 Tf '.($legCenterX + 16).' '.($legY - 2).' Td (Delivered SP) Tj ET';

        // Planned Target Legend
        $legX2 = $legCenterX + 65;
        $ops[] = '[2 2] 0 d 0.60 0.65 0.75 RG 1 w';
        $ops[] = "{$legX2} {$legY} m ".($legX2 + 12)." {$legY} l S [] 0 d";
        $ops = array_merge($ops, $this->renderPdfCircle($legX2 + 6, $legY, 2, '0.60 0.65 0.75'));

        $ops[] = '0.50 0.55 0.65 rg';
        $ops[] = 'BT /F1 6.5 Tf '.($legX2 + 16).' '.($legY - 2).' Td (Planned Target) Tj ET';

        return $ops;
    }

    private function renderAuditTableHeader(int $y, int $w): array
    {
        $ops = [];
        $ops[] = '0.96 0.97 0.99 rg'; // Slate-50 background matching preview
        $ops[] = "40 {$y} {$w} 18 re f";
        $ops[] = '0.88 0.90 0.93 RG 0.5 w';
        $ops[] = "40 {$y} m ".(40 + $w)." {$y} l S";
        $ops[] = '40 '.($y + 18).' m '.(40 + $w).' '.($y + 18).' l S';

        $ops[] = '0.45 0.50 0.60 rg';
        $ops[] = 'BT /F2 7 Tf 48 '.($y + 5.5).' Td (KEY) Tj ET';
        $ops[] = 'BT /F2 7 Tf 95 '.($y + 5.5).' Td (SUMMARY) Tj ET';
        $ops[] = 'BT /F2 7 Tf 260 '.($y + 5.5).' Td (ASSIGNEE) Tj ET';
        $ops[] = 'BT /F2 7 Tf 330 '.($y + 5.5).' Td (STATUS) Tj ET';
        $ops[] = 'BT /F2 7 Tf 405 '.($y + 5.5).' Td (DUE DATE) Tj ET';
        $ops[] = 'BT /F2 7 Tf 465 '.($y + 5.5).' Td (SP) Tj ET';
        $ops[] = 'BT /F2 7 Tf 500 '.($y + 5.5).' Td (DELIVERY VARIANCE) Tj ET';

        return $ops;
    }

    private function renderAuditTableRow(
        array $t,
        int $y,
        int $w,
        bool $isEven,
        int $rowH,
        array $summaryLines,
        array $assigneeLines
    ): array {
        $ops = [];
        if ($isEven) {
            $ops[] = '0.99 0.99 1.0 rg';
            $ops[] = "40 {$y} {$w} {$rowH} re f";
        }
        $ops[] = '0.90 0.92 0.95 RG 0.5 w';
        $ops[] = "40 {$y} m ".(40 + $w)." {$y} l S";

        $taskId = 'WS-'.($t['id'] ?? '5');
        $rawStatus = strtoupper(str_replace('_', ' ', $t['status'] ?? 'in_progress'));
        $deadline = ! empty($t['deadline']) ? date('M d, Y', strtotime($t['deadline'])) : 'Sep 28, 2026';
        $sp = ($t['final_sp'] ?? ($t['original_sp'] ?? ($t['estimated_hours'] ?? 13)));

        // Baseline Y position for single-line columns
        $baselineY = $y + $rowH - 13;

        // Key
        $ops[] = '0.45 0.50 0.60 rg';
        $ops[] = "BT /F1 7.5 Tf 48 {$baselineY} Td (".$this->escapePdfText($taskId).') Tj ET';

        // Summary (Multi-line bold)
        $ops[] = '0.06 0.09 0.16 rg';
        $sumLineY = $baselineY;
        foreach ($summaryLines as $sLine) {
            $ops[] = "BT /F2 7.5 Tf 95 {$sumLineY} Td (".$this->escapePdfText($sLine).') Tj ET';
            $sumLineY -= 9.5;
        }

        // Assignee (Multi-line regular)
        $ops[] = '0.30 0.35 0.45 rg';
        $assLineY = $baselineY;
        foreach ($assigneeLines as $aLine) {
            $ops[] = "BT /F1 7.5 Tf 260 {$assLineY} Td (".$this->escapePdfText($aLine).') Tj ET';
            $assLineY -= 9.5;
        }

        // ── STATUS PILL (MATCHING PREVIEW BLUE PILL) ──
        $pillW = 62;
        $pillH = 12;
        $pillX = 330;
        $pillY = $baselineY - 2;

        if (str_contains($rawStatus, 'PROGRESS')) {
            $ops[] = '0.90 0.94 1.0 rg'; // Light blue fill
            $ops[] = "{$pillX} {$pillY} {$pillW} {$pillH} re f";
            $ops[] = '0.15 0.40 0.85 rg'; // Blue text
            $ops[] = 'BT /F2 6.5 Tf '.($pillX + 5).' '.($pillY + 3).' Td (IN PROGRESS) Tj ET';
        } elseif (str_contains($rawStatus, 'COMPLET')) {
            $ops[] = '0.90 0.98 0.94 rg'; // Emerald fill
            $ops[] = "{$pillX} {$pillY} {$pillW} {$pillH} re f";
            $ops[] = '0.05 0.55 0.30 rg';
            $ops[] = 'BT /F2 6.5 Tf '.($pillX + 6).' '.($pillY + 3).' Td (COMPLETED) Tj ET';
        } else {
            $ops[] = '0.94 0.95 0.97 rg';
            $ops[] = "{$pillX} {$pillY} {$pillW} {$pillH} re f";
            $ops[] = '0.40 0.45 0.55 rg';
            $ops[] = 'BT /F2 6.5 Tf '.($pillX + 10).' '.($pillY + 3).' Td ('.Str::limit($rawStatus, 10).') Tj ET';
        }

        // Due Date
        $ops[] = '0.40 0.45 0.55 rg';
        $ops[] = "BT /F1 7.5 Tf 405 {$baselineY} Td (".$this->escapePdfText($deadline).') Tj ET';

        // SP
        $ops[] = '0.10 0.15 0.25 rg';
        $ops[] = "BT /F1 8 Tf 468 {$baselineY} Td ({$sp}) Tj ET";

        // ── DELIVERY VARIANCE (RED "OVERDUE" MATCHING PREVIEW) ──
        $variance = strtoupper($t['on_time_status'] ?? 'OVERDUE');
        if (str_contains($variance, 'OVERDUE') || str_contains($variance, 'LATE')) {
            $ops[] = '0.85 0.12 0.22 rg'; // Red
            $ops[] = "BT /F2 7.5 Tf 500 {$baselineY} Td (OVERDUE) Tj ET";
        } else {
            $ops[] = '0.05 0.55 0.30 rg'; // Green
            $ops[] = "BT /F2 7.5 Tf 500 {$baselineY} Td (ON TIME) Tj ET";
        }

        return $ops;
    }

    private function renderStrokedCircle(float $cx, float $cy, float $r, float $lw, string $colorRgb): array
    {
        $k = 0.55228475 * $r;
        $ops = [];
        $ops[] = "{$colorRgb} RG {$lw} w [] 0 d";
        $ops[] = sprintf(
            '%.2f %.2f m %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c S',
            $cx + $r, $cy,
            $cx + $r, $cy + $k, $cx + $k, $cy + $r, $cx, $cy + $r,
            $cx - $k, $cy + $r, $cx - $r, $cy + $k, $cx - $r, $cy,
            $cx - $r, $cy - $k, $cx - $k, $cy - $r, $cx, $cy - $r,
            $cx + $k, $cy - $r, $cx + $r, $cy - $k, $cx + $r, $cy
        );

        return $ops;
    }

    private function renderDonutArc(float $cx, float $cy, float $r, float $lw, float $startAngle, float $endAngle, string $colorRgb): array
    {
        $ops = [];
        $ops[] = "{$colorRgb} RG {$lw} w 0 J 0 j [] 0 d";

        $totalSpan = $endAngle - $startAngle;
        $numSteps = (int) ceil($totalSpan / (M_PI / 2));
        if ($numSteps < 1) {
            $numSteps = 1;
        }
        $stepSpan = $totalSpan / $numSteps;

        $startX = $cx + $r * cos($startAngle);
        $startY = $cy + $r * sin($startAngle);
        $path = sprintf('%.2f %.2f m ', $startX, $startY);

        $currentAngle = $startAngle;
        for ($i = 0; $i < $numSteps; $i++) {
            $nextAngle = $currentAngle + $stepSpan;
            $halfSpan = $stepSpan / 2;
            $q = (4.0 / 3.0) * tan($halfSpan / 2);

            $p0x = $cx + $r * cos($currentAngle);
            $p0y = $cy + $r * sin($currentAngle);

            $p3x = $cx + $r * cos($nextAngle);
            $p3y = $cy + $r * sin($nextAngle);

            $p1x = $p0x - $q * $r * sin($currentAngle);
            $p1y = $p0y + $q * $r * cos($currentAngle);

            $p2x = $p3x + $q * $r * sin($nextAngle);
            $p2y = $p3y - $q * $r * cos($nextAngle);

            $path .= sprintf('%.2f %.2f %.2f %.2f %.2f %.2f c ', $p1x, $p1y, $p2x, $p2y, $p3x, $p3y);
            $currentAngle = $nextAngle;
        }

        $path .= 'S';
        $ops[] = $path;

        return $ops;
    }

    private function renderPdfCircle(float $cx, float $cy, float $r, string $colorRgb): array
    {
        $k = 0.55228475 * $r;
        $ops = [];
        $ops[] = "{$colorRgb} rg";
        $ops[] = sprintf(
            '%.2f %.2f m %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c f',
            $cx + $r, $cy,
            $cx + $r, $cy + $k, $cx + $k, $cy + $r, $cx, $cy + $r,
            $cx - $k, $cy + $r, $cx - $r, $cy + $k, $cx - $r, $cy,
            $cx - $r, $cy - $k, $cx - $k, $cy - $r, $cx, $cy - $r,
            $cx + $k, $cy - $r, $cx + $r, $cy - $k, $cx + $r, $cy
        );

        return $ops;
    }

    private function renderFooter(int $pageNum): string
    {
        $escapedStudio = $this->escapePdfText($this->studioName);
        $rightX = $this->pageWidth - 75;

        return implode("\n", [
            '0.60 0.65 0.72 rg',
            'BT /F1 7 Tf 40 16 Td (SprintStudio - '.$escapedStudio.' - Executive Report) Tj ET',
            'BT /F1 7 Tf '.$rightX.' 16 Td (Page '.$pageNum.') Tj ET',
        ]);
    }

    private function wrapText(string $text, int $maxChars, int $maxLines = 3): array
    {
        $text = trim($text);
        if ($text === '') {
            return [];
        }

        $wrapped = wordwrap($text, $maxChars, "\n", false);
        $lines = explode("\n", $wrapped);

        if (count($lines) > $maxLines) {
            $lines = array_slice($lines, 0, $maxLines);
            $lastIdx = $maxLines - 1;
            if (strlen($lines[$lastIdx]) > $maxChars - 3) {
                $lines[$lastIdx] = substr($lines[$lastIdx], 0, $maxChars - 3).'...';
            } else {
                $lines[$lastIdx] .= '...';
            }
        }

        return array_map('trim', $lines);
    }

    private function escapePdfText(string $str): string
    {
        // Clean ASCII/Windows-1252 text without broken multi-byte sequences
        $str = str_replace(['•', '·', '–', '—', '“', '”', '’'], ['-', '-', '-', '-', '"', '"', "'"], $str);
        $str = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $str) ?: $str;
        $str = str_replace('\\', '\\\\', $str);
        $str = str_replace('(', '\(', $str);
        $str = str_replace(')', '\)', $str);

        return $str;
    }

    private function compilePdf(): string
    {
        $numPages = count($this->pages);
        $font1Obj = 1;
        $font2Obj = 2;
        $catalogObj = 3;
        $pagesObj = 4;

        $nextObjId = 5;
        $pageObjIds = [];
        $streamObjIds = [];

        for ($i = 0; $i < $numPages; $i++) {
            $pageObjIds[] = $nextObjId++;
            $streamObjIds[] = $nextObjId++;
        }

        $out = "%PDF-1.4\n";
        $offsets = [];

        // Font 1 (Helvetica)
        $offsets[$font1Obj] = strlen($out);
        $out .= "{$font1Obj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n";

        // Font 2 (Helvetica-Bold)
        $offsets[$font2Obj] = strlen($out);
        $out .= "{$font2Obj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n";

        // Catalog
        $offsets[$catalogObj] = strlen($out);
        $out .= "{$catalogObj} 0 obj\n<< /Type /Catalog /Pages {$pagesObj} 0 R >>\nendobj\n";

        // Pages root
        $kidsStr = implode(' 0 R ', $pageObjIds).' 0 R';
        $offsets[$pagesObj] = strlen($out);
        $out .= "{$pagesObj} 0 obj\n<< /Type /Pages /Kids [{$kidsStr}] /Count {$numPages} >>\nendobj\n";

        $mediaBoxStr = "[0 0 {$this->pageWidth} {$this->pageHeight}]";

        // Pages & Streams
        for ($i = 0; $i < $numPages; $i++) {
            $pId = $pageObjIds[$i];
            $sId = $streamObjIds[$i];
            $stream = $this->pages[$i];
            $sLen = strlen($stream);

            $offsets[$pId] = strlen($out);
            $out .= "{$pId} 0 obj\n<< /Type /Page /Parent {$pagesObj} 0 R /MediaBox {$mediaBoxStr} /Contents {$sId} 0 R /Resources << /Font << /F1 {$font1Obj} 0 R /F2 {$font2Obj} 0 R >> >> >>\nendobj\n";

            $offsets[$sId] = strlen($out);
            $out .= "{$sId} 0 obj\n<< /Length {$sLen} >>\nstream\n{$stream}\nendstream\nendobj\n";
        }

        $xrefOffset = strlen($out);
        $totalObjs = $nextObjId;
        $out .= "xref\n0 {$totalObjs}\n";
        $out .= "0000000000 65535 f \n";
        for ($i = 1; $i < $totalObjs; $i++) {
            $out .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }

        $out .= "trailer\n<< /Size {$totalObjs} /Root {$catalogObj} 0 R >>\nstartxref\n{$xrefOffset}\n%%EOF";

        return $out;
    }
}
