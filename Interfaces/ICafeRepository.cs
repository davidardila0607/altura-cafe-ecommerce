using CafeApi.Models;

namespace CafeApi.Interfaces
{
    public interface ICafeRepository
    {
        IEnumerable<Cafe> GetAll();
        Cafe? GetById(int id);
        Cafe Create(Cafe cafe);
        bool Update(int id, Cafe cafe);
        bool Delete(int id);
    }
}