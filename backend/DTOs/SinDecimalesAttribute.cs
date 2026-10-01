using System.ComponentModel.DataAnnotations;

namespace CafeApi.DTOs
{
    // ✅ Valida que un decimal no tenga parte fraccionaria.
    // Se usa en el precio (pesos colombianos, numeric(12,0)).
    [AttributeUsage(AttributeTargets.Property)]
    public sealed class SinDecimalesAttribute : ValidationAttribute
    {
        public override bool IsValid(object? value)
        {
            return value is not decimal numero
                || decimal.Truncate(numero) == numero;
        }
    }
}
