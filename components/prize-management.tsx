"use client"

import type React from "react"
import { Trophy } from "lucide-react" // Import Trophy icon

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Trash2,
  Plus,
  Edit2,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Car,
  Laptop,
  AirVent,
  Tv,
  Smartphone,
  Wind,
  Headphones,
  Volume2,
  Fan,
  Gift,
  Music,
  Play,
  Pause,
  VolumeX,
} from "lucide-react"

interface PrizeCategory {
  id: string
  name: string
  icon: React.ReactNode
  winnerCount: number
  color: string
  image: string
  description: string
  order: number
}

interface AudioSettings {
  drawingMusicEnabled: boolean
  winnerMusicEnabled: boolean
  volume: number
  drawingMusicUrl: string
  winnerMusicUrl: string
}

interface PrizeManagementProps {
  categories: PrizeCategory[]
  onCategoriesChange: (categories: PrizeCategory[]) => void
  audioSettings: AudioSettings
  onAudioSettingsChange: (settings: AudioSettings) => void
}

const iconOptions = [
  { name: "Car", icon: <Car className="w-5 h-5" />, value: "Car" },
  { name: "Laptop", icon: <Laptop className="w-5 h-5" />, value: "Laptop" },
  { name: "Air Vent", icon: <AirVent className="w-5 h-5" />, value: "AirVent" },
  { name: "TV", icon: <Tv className="w-5 h-5" />, value: "Tv" },
  { name: "Smartphone", icon: <Smartphone className="w-5 h-5" />, value: "Smartphone" },
  { name: "Wind", icon: <Wind className="w-5 h-5" />, value: "Wind" },
  { name: "Headphones", icon: <Headphones className="w-5 h-5" />, value: "Headphones" },
  { name: "Volume", icon: <Volume2 className="w-5 h-5" />, value: "Volume2" },
  { name: "Fan", icon: <Fan className="w-5 h-5" />, value: "Fan" },
  { name: "Gift", icon: <Gift className="w-5 h-5" />, value: "Gift" },
]

const colorOptions = [
  { name: "Yellow to Orange", value: "bg-gradient-to-r from-yellow-400 to-orange-500" },
  { name: "Blue to Purple", value: "bg-gradient-to-r from-blue-500 to-purple-600" },
  { name: "Gray to Black", value: "bg-gradient-to-r from-gray-700 to-gray-900" },
  { name: "Cyan to Blue", value: "bg-gradient-to-r from-cyan-400 to-blue-500" },
  { name: "Purple to Pink", value: "bg-gradient-to-r from-purple-500 to-pink-500" },
  { name: "Green to Blue", value: "bg-gradient-to-r from-green-400 to-blue-500" },
  { name: "Teal to Green", value: "bg-gradient-to-r from-teal-400 to-green-500" },
  { name: "Indigo to Purple", value: "bg-gradient-to-r from-indigo-500 to-purple-600" },
  { name: "Pink to Red", value: "bg-gradient-to-r from-pink-500 to-red-500" },
  { name: "Emerald to Teal", value: "bg-gradient-to-r from-emerald-400 to-teal-500" },
]

const predefinedMusic = [
  {
    name: "Upbeat Drawing Music",
    url: "https://www.soundjay.com/misc/sounds/drum-roll-1.mp3",
    type: "drawing",
  },
  {
    name: "Victory Fanfare",
    url: "https://www.soundjay.com/misc/sounds/fanfare-1.mp3",
    type: "winner",
  },
  {
    name: "Suspenseful Drums",
    url: "https://www.soundjay.com/misc/sounds/drum-roll-2.mp3",
    type: "drawing",
  },
  {
    name: "Celebration Music",
    url: "https://www.soundjay.com/misc/sounds/ta-da.mp3",
    type: "winner",
  },
]

export function PrizeManagement({
  categories,
  onCategoriesChange,
  audioSettings,
  onAudioSettingsChange,
}: PrizeManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    winnerCount: 1,
    color: "bg-gradient-to-r from-blue-500 to-purple-600",
    image: "",
    description: "",
    icon: "Gift",
  })
  const [isAdding, setIsAdding] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: "",
    winnerCount: 1,
    color: "bg-gradient-to-r from-blue-500 to-purple-600",
    image: "",
    description: "",
    icon: "Gift",
  })
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null)
  const [isTestPlaying, setIsTestPlaying] = useState(false)

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find((opt) => opt.value === iconName)
    return iconOption ? iconOption.icon : <Gift className="w-5 h-5" />
  }

  const startEdit = (category: PrizeCategory) => {
    setEditingId(category.id)
    setEditForm({
      name: category.name,
      winnerCount: category.winnerCount,
      color: category.color,
      image: category.image,
      description: category.description,
      icon: "Gift", // Default fallback
    })
  }

  const saveEdit = () => {
    if (!editingId) return

    const updatedCategories = categories.map((cat) =>
      cat.id === editingId
        ? {
            ...cat,
            name: editForm.name,
            winnerCount: editForm.winnerCount,
            color: editForm.color,
            image: editForm.image,
            description: editForm.description,
            icon: getIconComponent(editForm.icon),
          }
        : cat,
    )

    onCategoriesChange(updatedCategories)
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({
      name: "",
      winnerCount: 1,
      color: "bg-gradient-to-r from-blue-500 to-purple-600",
      image: "",
      description: "",
      icon: "Gift",
    })
  }

  const deleteCategory = (id: string) => {
    const updatedCategories = categories.filter((cat) => cat.id !== id)
    // Reorder remaining categories
    const reorderedCategories = updatedCategories.map((cat, index) => ({
      ...cat,
      order: index + 1,
    }))
    onCategoriesChange(reorderedCategories)
  }

  const moveCategory = (id: string, direction: "up" | "down") => {
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order)
    const currentIndex = sortedCategories.findIndex((cat) => cat.id === id)

    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === sortedCategories.length - 1)
    ) {
      return
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const updatedCategories = [...sortedCategories]

    // Swap positions
    ;[updatedCategories[currentIndex], updatedCategories[newIndex]] = [
      updatedCategories[newIndex],
      updatedCategories[currentIndex],
    ]

    // Update order values
    const reorderedCategories = updatedCategories.map((cat, index) => ({
      ...cat,
      order: index + 1,
    }))

    onCategoriesChange(reorderedCategories)
  }

  const addCategory = () => {
    if (!newCategory.name.trim()) return

    const maxOrder = Math.max(...categories.map((cat) => cat.order), 0)
    const newCat: PrizeCategory = {
      id: `category-${Date.now()}`,
      name: newCategory.name,
      icon: getIconComponent(newCategory.icon),
      winnerCount: newCategory.winnerCount,
      color: newCategory.color,
      image: newCategory.image,
      description: newCategory.description,
      order: maxOrder + 1,
    }

    onCategoriesChange([...categories, newCat])
    setNewCategory({
      name: "",
      winnerCount: 1,
      color: "bg-gradient-to-r from-blue-500 to-purple-600",
      image: "",
      description: "",
      icon: "Gift",
    })
    setIsAdding(false)
  }

  const testPlayAudio = (url: string) => {
    if (testAudio) {
      testAudio.pause()
      setTestAudio(null)
      setIsTestPlaying(false)
    }

    if (url) {
      const audio = new Audio(url)
      audio.volume = audioSettings.volume / 100
      audio.onended = () => {
        setIsTestPlaying(false)
        setTestAudio(null)
      }
      audio.onerror = () => {
        alert("Error playing audio. Please check the URL.")
        setIsTestPlaying(false)
        setTestAudio(null)
      }

      setTestAudio(audio)
      setIsTestPlaying(true)
      audio.play().catch(() => {
        alert("Unable to play audio. Please check the URL or browser permissions.")
        setIsTestPlaying(false)
        setTestAudio(null)
      })
    }
  }

  const stopTestAudio = () => {
    if (testAudio) {
      testAudio.pause()
      setTestAudio(null)
      setIsTestPlaying(false)
    }
  }

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-6">
      {/* Audio Settings Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Music className="w-5 h-5" />
            Audio & Music Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Master Volume
              </Label>
              <div className="flex items-center gap-2">
                {audioSettings.volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
                <span className="text-white text-sm w-12">{audioSettings.volume}%</span>
              </div>
            </div>
            <Slider
              value={[audioSettings.volume]}
              onValueChange={(value) => onAudioSettingsChange({ ...audioSettings, volume: value[0] })}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Drawing Music Settings */}
          <div className="space-y-4 p-4 border border-slate-600 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Headphones className="w-4 h-4" />
                Drawing Animation Music
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="drawing-music-enabled"
                  checked={audioSettings.drawingMusicEnabled}
                  onChange={(e) =>
                    onAudioSettingsChange({
                      ...audioSettings,
                      drawingMusicEnabled: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="drawing-music-enabled" className="text-white text-sm">
                  Enable
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm">Music URL</Label>
              <div className="flex gap-2">
                <Input
                  value={audioSettings.drawingMusicUrl}
                  onChange={(e) =>
                    onAudioSettingsChange({
                      ...audioSettings,
                      drawingMusicUrl: e.target.value,
                    })
                  }
                  placeholder="Enter music URL or select from presets"
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                />
                <Button
                  onClick={() => testPlayAudio(audioSettings.drawingMusicUrl)}
                  disabled={!audioSettings.drawingMusicUrl || isTestPlaying}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isTestPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                {isTestPlaying && (
                  <Button
                    onClick={stopTestAudio}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-white bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {predefinedMusic
                .filter((music) => music.type === "drawing")
                .map((music, index) => (
                  <Button
                    key={index}
                    onClick={() =>
                      onAudioSettingsChange({
                        ...audioSettings,
                        drawingMusicUrl: music.url,
                      })
                    }
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-white hover:bg-slate-700 text-xs"
                  >
                    {music.name}
                  </Button>
                ))}
            </div>
          </div>

          {/* Winner Announcement Music Settings */}
          <div className="space-y-4 p-4 border border-slate-600 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Winner Announcement Music
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="winner-music-enabled"
                  checked={audioSettings.winnerMusicEnabled}
                  onChange={(e) =>
                    onAudioSettingsChange({
                      ...audioSettings,
                      winnerMusicEnabled: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="winner-music-enabled" className="text-white text-sm">
                  Enable
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white text-sm">Music URL</Label>
              <div className="flex gap-2">
                <Input
                  value={audioSettings.winnerMusicUrl}
                  onChange={(e) =>
                    onAudioSettingsChange({
                      ...audioSettings,
                      winnerMusicUrl: e.target.value,
                    })
                  }
                  placeholder="Enter music URL or select from presets"
                  className="bg-slate-700 border-slate-600 text-white flex-1"
                />
                <Button
                  onClick={() => testPlayAudio(audioSettings.winnerMusicUrl)}
                  disabled={!audioSettings.winnerMusicUrl || isTestPlaying}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isTestPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                {isTestPlaying && (
                  <Button
                    onClick={stopTestAudio}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-white bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {predefinedMusic
                .filter((music) => music.type === "winner")
                .map((music, index) => (
                  <Button
                    key={index}
                    onClick={() =>
                      onAudioSettingsChange({
                        ...audioSettings,
                        winnerMusicUrl: music.url,
                      })
                    }
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-white hover:bg-slate-700 text-xs"
                  >
                    {music.name}
                  </Button>
                ))}
            </div>
          </div>

          {/* Audio Instructions */}
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <h4 className="font-medium text-orange-200 mb-2 flex items-center gap-2">
              <Music className="w-4 h-4" />
              Audio Setup Instructions:
            </h4>
            <ul className="text-sm text-orange-300 space-y-1">
              <li>
                • <strong>Drawing Music</strong> - Plays during the spinning animation (3-4 seconds)
              </li>
              <li>
                • <strong>Winner Music</strong> - Plays when a winner is announced (2-3 seconds)
              </li>
              <li>• Use short audio clips for best experience (under 10 seconds)</li>
              <li>• Supported formats: MP3, WAV, OGG</li>
              <li>• Test audio before starting the draw to ensure proper playback</li>
              <li>• Volume control affects all audio playback during the event</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Prize Categories Management */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Prize Categories Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedCategories.map((category, index) => (
            <div key={category.id} className="flex items-center justify-between p-4 border border-slate-600 rounded-lg">
              {editingId === category.id ? (
                <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <Label htmlFor={`name-${category.id}`} className="text-white">
                      Name
                    </Label>
                    <Input
                      id={`name-${category.id}`}
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`count-${category.id}`} className="text-white">
                      Winners
                    </Label>
                    <Input
                      id={`count-${category.id}`}
                      type="number"
                      min="1"
                      value={editForm.winnerCount}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, winnerCount: Number.parseInt(e.target.value) || 1 }))
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`color-${category.id}`} className="text-white">
                      Color
                    </Label>
                    <select
                      id={`color-${category.id}`}
                      value={editForm.color}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-full p-2 border rounded-md bg-slate-700 border-slate-600 text-white"
                    >
                      {colorOptions.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`icon-${category.id}`} className="text-white">
                      Icon
                    </Label>
                    <select
                      id={`icon-${category.id}`}
                      value={editForm.icon}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, icon: e.target.value }))}
                      className="w-full p-2 border rounded-md bg-slate-700 border-slate-600 text-white"
                    >
                      {iconOptions.map((icon) => (
                        <option key={icon.value} value={icon.value}>
                          {icon.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor={`image-${category.id}`} className="text-white">
                      Image URL
                    </Label>
                    <Input
                      id={`image-${category.id}`}
                      value={editForm.image}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, image: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Image URL"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button onClick={saveEdit} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={cancelEdit}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-white bg-transparent"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="md:col-span-6">
                    <Label htmlFor={`desc-${category.id}`} className="text-white">
                      Description
                    </Label>
                    <Textarea
                      id={`desc-${category.id}`}
                      value={editForm.description}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        onClick={() => moveCategory(category.id, "up")}
                        disabled={index === 0}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-slate-700 p-1 h-auto"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <GripVertical className="w-4 h-4 text-gray-500" />
                      <Button
                        onClick={() => moveCategory(category.id, "down")}
                        disabled={index === sortedCategories.length - 1}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-slate-700 p-1 h-auto"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>
                    <Badge variant="outline" className="text-white border-gray-500">
                      #{category.order}
                    </Badge>
                    <div className={`p-2 rounded-full ${category.color} text-white`}>{category.icon}</div>
                    <div>
                      <h4 className="font-medium text-white">{category.name}</h4>
                      <p className="text-sm text-gray-400">{category.description}</p>
                      <p className="text-sm text-gray-400">
                        {category.winnerCount} winner{category.winnerCount > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => startEdit(category)}
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-white hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteCategory(category.id)}
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Add New Category */}
          {isAdding ? (
            <div className="p-4 border-2 border-dashed border-slate-600 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <Label htmlFor="new-name" className="text-white">
                    Name
                  </Label>
                  <Input
                    id="new-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Prize name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="new-count" className="text-white">
                    Winners
                  </Label>
                  <Input
                    id="new-count"
                    type="number"
                    min="1"
                    value={newCategory.winnerCount}
                    onChange={(e) =>
                      setNewCategory((prev) => ({ ...prev, winnerCount: Number.parseInt(e.target.value) || 1 }))
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="new-color" className="text-white">
                    Color
                  </Label>
                  <select
                    id="new-color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-full p-2 border rounded-md bg-slate-700 border-slate-600 text-white"
                  >
                    {colorOptions.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="new-icon" className="text-white">
                    Icon
                  </Label>
                  <select
                    id="new-icon"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, icon: e.target.value }))}
                    className="w-full p-2 border rounded-md bg-slate-700 border-slate-600 text-white"
                  >
                    {iconOptions.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="new-image" className="text-white">
                    Image URL
                  </Label>
                  <Input
                    id="new-image"
                    value={newCategory.image}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, image: e.target.value }))}
                    placeholder="Image URL"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={addCategory} size="sm" className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setIsAdding(false)}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="md:col-span-6">
                  <Label htmlFor="new-desc" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="new-desc"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Prize description"
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed border-slate-600 text-white hover:bg-slate-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Prize Category
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
