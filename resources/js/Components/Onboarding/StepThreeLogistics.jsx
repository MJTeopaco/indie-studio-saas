import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export default function StepThreeLogistics({ data, setData, errors }) {
    // Generate a list of common timezones for the MVP, or use Intl.supportedValuesOf('timeZone')
    // We'll use a curated list to avoid a massive 400+ item dropdown for now.
    const commonTimezones = [
        "UTC",
        "Asia/Manila",
        "Asia/Tokyo",
        "Asia/Kolkata",
        "Asia/Dubai",
        "Europe/London",
        "Europe/Paris",
        "Europe/Berlin",
        "America/New_York",
        "America/Chicago",
        "America/Denver",
        "America/Los_Angeles",
        "America/Sao_Paulo",
        "Australia/Sydney",
        "Pacific/Auckland"
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Working Constraints & Logistics</h2>
                <p className="mt-1 text-text-muted">Set your physical constraints for accurate project scheduling.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div>
                    <InputLabel htmlFor="max_hours_per_week" value="Maximum Capacity *" className="text-text-primary" />
                    <select
                        id="max_hours_per_week"
                        value={data.max_hours_per_week}
                        onChange={(e) => setData('max_hours_per_week', e.target.value)}
                        className="mt-1 block w-full rounded-md border-surface-border bg-surface shadow-sm focus:border-brand focus:ring-brand sm:text-sm text-text-primary"
                    >
                        <option value="" disabled>Select your weekly hours...</option>
                        {[10, 20, 30, 40, 50, 60].map((hours) => (
                            <option key={hours} value={hours}>
                                {hours} hours / week
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-text-muted">Helps calculate realistic CPM timelines.</p>
                    <InputError message={errors.max_hours_per_week} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="timezone" value="Primary Timezone *" className="text-text-primary" />
                    <select
                        id="timezone"
                        value={data.timezone}
                        onChange={(e) => setData('timezone', e.target.value)}
                        className="mt-1 block w-full rounded-md border-surface-border bg-surface shadow-sm focus:border-brand focus:ring-brand sm:text-sm text-text-primary"
                    >
                        <option value="" disabled>Select your timezone...</option>
                        {commonTimezones.map((tz) => (
                            <option key={tz} value={tz}>
                                {tz}
                            </option>
                        ))}
                    </select>
                    <p className="mt-1 text-xs text-text-muted">Crucial for coordinating dependent tasks.</p>
                    <InputError message={errors.timezone} className="mt-2" />
                </div>
            </div>
        </div>
    );
}
