import { validatePassword, getStrengthColor, getStrengthLabel } from "@/lib/passwordValidation";
import { CheckCircle2, XCircle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  showErrors?: boolean;
}

const PasswordStrengthMeter = ({ password, showErrors = true }: PasswordStrengthMeterProps) => {
  if (!password) return null;

  const validation = validatePassword(password);

  return (
    <div className="space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getStrengthColor(validation.strength)}`}
            style={{ width: `${validation.score}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          validation.strength === 'weak' ? 'text-destructive' :
          validation.strength === 'fair' ? 'text-orange-500' :
          validation.strength === 'good' ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {getStrengthLabel(validation.strength)}
        </span>
      </div>

      {/* Error/requirement list */}
      {showErrors && validation.errors.length > 0 && (
        <ul className="space-y-1">
          {validation.errors.map((error, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              {error}
            </li>
          ))}
        </ul>
      )}

      {/* Success state */}
      {validation.isValid && (
        <div className="flex items-center gap-1.5 text-xs text-green-500">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Password meets all requirements
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
