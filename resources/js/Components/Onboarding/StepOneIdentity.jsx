import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';

export default function StepOneIdentity({ data, setData, errors, positions }) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Core Professional Identity</h2>
                <p className="mt-1 text-text-muted">Establish your primary role and experience level.</p>
            </div>

            <div className="space-y-5">
                <div>
                    <InputLabel htmlFor="position_id" value="Primary Role *" className="text-text-primary" />
                    <select
                        id="position_id"
                        value={data.position_id}
                        onChange={(e) => setData('position_id', e.target.value)}
                        className="mt-1 block w-full rounded-md border-surface-border bg-surface shadow-sm focus:border-brand focus:ring-brand sm:text-sm text-text-primary"
                    >
                        <option value="" disabled>Select your primary role...</option>
                        {positions.map((pos) => (
                            <option key={pos.id} value={pos.id}>
                                {pos.name}
                            </option>
                        ))}
                    </select>
                    <InputError message={errors.position_id} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="experience_years" value="Experience Years (Continuous Value) *" className="text-text-primary" />
                    <input
                        id="experience_years"
                        type="number"
                        min="0"
                        max="40"
                        step="0.5"
                        value={data.experience_years}
                        onChange={(e) => setData('experience_years', e.target.value)}
                        className="mt-1 block w-full rounded-md border-surface-border bg-surface shadow-sm focus:border-brand focus:ring-brand sm:text-sm text-text-primary"
                        placeholder="e.g., 2.5"
                    />
                    <p className="mt-1 text-xs text-text-muted">Enter your total professional experience (e.g., 2.5 years).</p>
                    <InputError message={errors.experience_years} className="mt-2" />
                </div>

                <div className="pt-4 border-t border-surface-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <InputLabel value="Global Availability Status" className="text-text-primary text-base" />
                            <p className="text-sm text-text-muted">Open to platform invitations from new studios.</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={data.open_to_invitations}
                            onClick={() => setData('open_to_invitations', !data.open_to_invitations)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-elevated ${
                                data.open_to_invitations ? 'bg-brand' : 'bg-surface-border'
                            }`}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    data.open_to_invitations ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                    </div>
                    <InputError message={errors.open_to_invitations} className="mt-2" />
                </div>
            </div>
        </div>
    );
}
