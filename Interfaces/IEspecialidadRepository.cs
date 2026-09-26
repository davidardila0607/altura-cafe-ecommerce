using CafeApi.Models;

namespace CafeApi.Interfaces
{
    public interface IEspecialidadRepository
    {
        IEnumerable<Especialidad> GetAll();
        Especialidad? GetById(int id);
        Especialidad Create(Especialidad especialidad);
        bool Update(int id, Especialidad especialidad);
        bool Delete(int id);
    }
}