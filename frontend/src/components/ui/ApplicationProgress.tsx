import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export interface ApplicationDay {
    day: string
    value: number
}

export function ApplicationProgress({ data = [] }: { data?: ApplicationDay[] }) {
    return (
        <div className="bg-white rounded-xl shadow p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold mb-4">Progresso de Aplicações</h3>

            {data.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">
                    Nenhuma aplicação registrada ainda.
                </p>
            ) : (
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="day" />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px"
                            }}
                        />
                        <Bar dataKey="value" fill="#2e7bff" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}
