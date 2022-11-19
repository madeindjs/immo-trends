import type { NextApiRequest, NextApiResponse } from "next";
import { YearStat } from "../../../models";

import { getDvfStats } from "../../../services";

export default function handler(req: NextApiRequest, res: NextApiResponse<YearStat>) {
  const { zipCode, year } = req.body;

  getDvfStats(year, zipCode)
    .then((stats) => res.status(200).json(stats))
    .catch((error) => res.status(500).json(error));
}
